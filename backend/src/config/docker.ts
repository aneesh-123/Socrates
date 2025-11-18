import Docker from 'dockerode';

// Initialize Docker client
const docker = new Docker();

// Docker configuration constants
export const DOCKER_CONFIG = {
  // Base image for C++ compilation and execution
  IMAGE: 'gcc:latest',
  
  // Resource limits
  CPU_LIMIT: 1, // 1 CPU core
  MEMORY_LIMIT: 128 * 1024 * 1024, // 128MB
  MEMORY_SWAP: 128 * 1024 * 1024, // No swap
  
  // Execution timeout (seconds)
  EXECUTION_TIMEOUT: 10,
  
  // Compilation timeout (seconds)
  COMPILATION_TIMEOUT: 5,
  
  // Maximum code size (bytes)
  MAX_CODE_SIZE: 10 * 1024, // 10KB
};

export default docker;

