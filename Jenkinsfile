pipeline {
    agent any
    environment {
        // Global Config
        CONTRACT_ADDRESS = "0x54f999F2b6F60B2D4F67cB6Df1d3435E588763c7"
        NETWORK = "sepolia" // or localhost
        
        // Secrets (should be credentials in Jenkins)
        // PRIVATE_KEY is populated from Jenkins credentials
    }

    stages {
        stage('Build & Test (CI)') {
            steps {
                script {
                    echo 'Building Docker Image...'
                    // 1. Build
                    sh 'docker build ./client -t myapp:latest'
                    
                    // 2. Get Hash
                    // Use trim() to remove newline
                    env.IMAGE_HASH = sh(script: 'docker inspect --format="{{.Id}}" myapp:latest', returnStdout: true).trim()
                    env.IMAGE_NAME = "myapp:latest"
                    
                    echo "Generated Hash: ${env.IMAGE_HASH}"
                }
            }
        }

        stage('Register on Blockchain (Vendor)') {
            steps {
                script {
                    echo 'Registering Image Hash...'
                    // 3. Register Script
                    // Hardhat requires PRIVATE_KEY env var
                    withCredentials([string(credentialsId: 'sepolia-private-key', variable: 'PRIVATE_KEY')]) {
                        dir('blockchain') {
                            sh '''
                               export IMAGE_NAME="${IMAGE_NAME}"
                               export IMAGE_HASH="${IMAGE_HASH}"
                               export CONTRACT_ADDRESS="${CONTRACT_ADDRESS}"
                               
                               npx hardhat run scripts/register-cli.ts --network ${NETWORK}
                            '''
                        }
                    }
                }
            }
        }

        stage('Verify & Deploy (Client/CD)') {
            steps {
                script {
                    echo 'Verifying Image Integrity...'
                    // 4. Verify Script
                    // Simulating Client side: we have the image, we check if it is valid
                    
                    // Re-calculate hash (Consumer side)
                    env.RECEIVED_HASH = sh(script: 'docker inspect --format="{{.Id}}" myapp:latest', returnStdout: true).trim()
                    
                    try {
                        dir('blockchain') {
                            sh '''
                               export IMAGE_NAME="myapp:latest"
                               export IMAGE_HASH="${RECEIVED_HASH}"
                               export CONTRACT_ADDRESS="${CONTRACT_ADDRESS}"

                               npx hardhat run scripts/verify-cli.js --network ${NETWORK}
                            '''
                        }
                        echo "✅ Verification Passed. Deploying..."
                    } catch (err) {
                        error "❌ Verification Failed! Deployment Aborted."
                    }
                }
            }
        }


        stage('Deploy to K8s') {
            steps {
                echo 'Deploying to Kubernetes...'
                // sh 'kubectl apply -f k8s/deployment.yaml'
            }
        }
    }
}
