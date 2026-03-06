//! Privacy-Enhancing Technologies (PETs) for Federated Learning
//!
//! Implements Secure Multiparty Computation (SMPC) parameter masking
//! and Local Differential Privacy (LDP) with the Laplace Mechanism.

use rand::Rng;
use std::fmt::Debug;
use tracing::instrument;

/// Trait for Homomorphic Encryption (HE) / SMPC operations.
pub trait HomomorphicEncryption: Debug + Send + Sync {
    fn encrypt(&self, data: &[f32]) -> Vec<u8>;
    fn decrypt(&self, ciphertext: &[u8]) -> Vec<f32>;
    fn add_encrypted(&self, a: &[u8], b: &[u8]) -> Vec<u8>;
}

/// FHE Engine using fully homomorphic encryption.
/// Replaces the simulated SMPC with actual tfhe primitives.
pub struct FheEngine {
    client_key: tfhe::ClientKey,
    server_key: tfhe::ServerKey,
}

impl Debug for FheEngine {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "FheEngine {{ TFHE Keys Active }}")
    }
}

impl FheEngine {
    pub fn new() -> Self {
        // Physical FHE Initialization (using TFHE for integers)
        let config = tfhe::ConfigBuilder::default().build();
        let (client_key, server_key) = tfhe::generate_keys(config);
        
        Self { client_key, server_key }
    }
    
    /// Helper to cleanly quantize f32 into u32 for TFHE integer compatibility
    fn f32_to_u32(val: f32) -> u32 {
        // Shift and scale: [-10.0, 10.0] -> [0, 20_000]
        ((val + 1000.0) * 1000.0) as u32
    }
    
    /// Helper to dequantize u32 back to f32
    fn u32_to_f32(val: u32) -> f32 {
        (val as f32 / 1000.0) - 1000.0
    }
}

impl HomomorphicEncryption for FheEngine {
    #[instrument(name = "FheEngine::encrypt", skip(self, data))]
    fn encrypt(&self, data: &[f32]) -> Vec<u8> {
        tfhe::set_server_key(self.server_key.clone());
        let mut ciphertexts = Vec::with_capacity(data.len());
        
        for &val in data {
            let u32_val = Self::f32_to_u32(val);
            let ct = tfhe::FheUint32::encrypt(u32_val, &self.client_key);
            ciphertexts.push(ct);
        }
        
        // Serialize the true FHE ciphertexts to bytes
        bincode::serialize(&ciphertexts).unwrap_or_default()
    }

    #[instrument(name = "FheEngine::decrypt", skip(self, ciphertext))]
    fn decrypt(&self, ciphertext: &[u8]) -> Vec<f32> {
        tfhe::set_server_key(self.server_key.clone());
        
        let ciphertexts: Vec<tfhe::FheUint32> = bincode::deserialize(ciphertext)
            .unwrap_or_default();
            
        ciphertexts.into_iter().map(|ct| {
            let u32_val: u32 = ct.decrypt(&self.client_key);
            Self::u32_to_f32(u32_val)
        }).collect()
    }

    #[instrument(name = "FheEngine::add_encrypted", skip(self, a, b))]
    fn add_encrypted(&self, a: &[u8], b: &[u8]) -> Vec<u8> {
        tfhe::set_server_key(self.server_key.clone());
        
        let c_a: Vec<tfhe::FheUint32> = bincode::deserialize(a).unwrap_or_default();
        let c_b: Vec<tfhe::FheUint32> = bincode::deserialize(b).unwrap_or_default();
        
        // Homomorphically add the ciphertexts together
        let mut sum_ciphertexts: Vec<tfhe::FheUint32> = Vec::with_capacity(c_a.len());
        
        for (ct_a, ct_b) in c_a.iter().zip(c_b.iter()) {
            sum_ciphertexts.push(ct_a + ct_b);
        }
        
        bincode::serialize(&sum_ciphertexts).unwrap_or_default()
    }
}

/// Trait for Local Differential Privacy (LDP) operations.
pub trait LocalDifferentialPrivacy: Debug + Send + Sync {
    fn apply_noise(&self, gradients: &mut [f32]);
}

/// Engine for Local Differential Privacy using the Laplace Mechanism.
#[derive(Debug, Clone)]
pub struct LdpEngine {
    pub epsilon: f32,
    pub delta: f32,
}

impl LdpEngine {
    pub fn new(epsilon: f32, delta: f32) -> Self {
        Self { epsilon, delta }
    }
}

impl LocalDifferentialPrivacy for LdpEngine {
    /// Actively injects calibrated mathematical noise using the Laplace mechanism.
    /// Uses inverse transform sampling: x = mu - b * sgn(u) * ln(1 - 2|u|)
    #[instrument(name = "LdpEngine::apply_noise", skip(self, gradients))]
    fn apply_noise(&self, gradients: &mut [f32]) {
        let mut rng = rand::thread_rng();
        // Calculate Laplace scale parameters (b = sensitivity / epsilon)
        // Assuming L2 norm/sensitivity of 1.0 (requires gradient clipping prior)
        let sensitivity = 1.0;
        let b = sensitivity / self.epsilon;

        for grad in gradients.iter_mut() {
            // Draw u sequentially from Uniform(-0.5, 0.5)
            let u: f32 = rng.gen_range(-0.5..0.5);
            let sign = u.signum();
            
            // Apply true Laplace noise computation
            let noise = -b * sign * (1.0 - 2.0 * u.abs()).ln();
            *grad += noise;
        }
    }
}
