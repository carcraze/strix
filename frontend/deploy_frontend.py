import os
import subprocess

env_vars = []
with open('.env.local') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars.append(f"_{k}={v}")

substitutions = ",".join(env_vars)
print(f"Submitting build with substitutions...")

cmd1 = ["gcloud", "builds", "submit", "--config", "cloudbuild.yaml", f"--substitutions={substitutions}", "."]
subprocess.run(cmd1, check=True)

print("Deploying frontend to Cloud Run...")
cmd2 = [
    "gcloud", "run", "deploy", "zentinel-frontend",
    "--image", "gcr.io/moyopal-453021/zentinel-frontend",
    "--region", "us-central1",
    "--project", "moyopal-453021",
    "--allow-unauthenticated"
]
subprocess.run(cmd2, check=True)
print("Deployment complete!")
