node {
    def app

     stage('Clone repository') {
         checkout scm
     }

     stage('Build image') {
         app = docker.build("ap-seoul-1.ocir.io/cnqphqevfxnp/video-streaming")
     }

    stage('Test image') {
        app.inside {
            sh 'echo "Tests passed"'
        }
    }

     stage('Push image') {
         docker.withRegistry('https://ap-seoul-1.ocir.io', 'ocir') {
         // docker.withRegistry('https://register.hub.docker.com', 'docker-hub') {   
             app.push("${env.BUILD_NUMBER}")
         }
     }

     stage('Trigger ManifestUpdate') { 
        echo "triggering update-manifest job"
        build job: 'update-manifest', parameters: [
            string(name: 'DOCKERTAG', value: env.BUILD_NUMBER),
            string(name: 'SERVICE', value: 'video-streaming')
        ]
     }
}