Language

Description

AutoFix

Score


AWS

DynamoDB backups are off

DynamoDB is running without automated backups. Point-in-time recovery recovery can help you recover from accidental write or delete operations.

Yes
High
AWS

Load balancer allows invalid HTTP headers

AWS's Application load balancers have an option to drop invalid header fields. For compliance, and as a best practice it's best to turn on this functionality to prevent invalid headers from hitting your web servers.

Yes
High
AWS

Docker image repository not encrypted at rest

AWS ECR offers out of the box encryption at rest. For compliance reasons and as a best practice, it's best to turn this on.

Yes
High
AWS

SNS topics are not encrypted at rest

AWS SNS offers managed encryption at rest. This ensures that messages sent to topics are fully encrypted at rest, which may be obligatory when you operate in a regulated market (e.g. with HIPAA for healthcare).

Yes
Low
AWS

Elasticsearch domain might have outdated TLS version

The minimum allowed TLS version is not configured on some Elasticsearch domains. This could allow clients to communicate over older, broken versions of TLS with this Elasticsearch domain.

Yes
Low
AWS

Elasticsearch domain is not encrypted at rest

Elasticsearch offers out of the box encryption at rest. For compliance reasons and as a best practice, it's best to turn this on.

Yes
Low
AWS

SQS queue data is not encrypted

SQS offers out of the box encryption for queue messages. For compliance reasons and as a best practice, it's best to turn this on.

Yes
Low
AWS

DNSSEC is disabled

DNSSEC is disabled for some domains. DNSSEC prevents attacks such as DNS cache poisoning and DNS spoofing. This prevents tampering with DNS records and sending your users to unexpected websites. This can result in extremely hard to detect phishing attacks on your users.

Yes
High
AWS

Load balancer is using outdated TLS policy

An Application load balancer is using an outdated TLS policy. Some older versions of SSL are broken in various ways, such as TLS1.1 and SSLv3.

Yes
Critical
AWS

Deletion protection is disabled for RDS database

Deletion protection is an added layer of protection against accidental or malicious database deletion. It can help prevent both insider and outsider threats.

Yes
Medium
AWS

Firewall rules allow SSH from any public IP

We detected inbound rules allowing access from 0.0.0.0/0 or ::/0 (anywhere) to port 22. Having security groups open allows any user or malware with vpc access to scan for well known and sensitive ports and gain access to instance.

No
High
AWS

IAM user has access rights that allow data exfiltration

We detected an IAM user or role with the access rights the S3:GetObject, secretsmanager or RDS snapshots. Without a resource condition restricting them to specific resources (buckets, secrets or databases), these access rights allow escalation without any limits.

No
High
AWS

EC2 IAM roles vulnerable to SSRF attacks

IMDS is an internal AWS service used by EC2 instances to fetch their IAM roles. EC2 Instances should have Metadata Service version 2 (IMDSv2) enabled and required. Using IMDSv2 will protect from misconfiguration and SSRF vulnerabilities. IMDSv1 will not.

Yes
High
AWS

S3 Buckets should have block public access globally

S3 Buckets should have a default public access block enabled to make sure they cannot be made public accidentally. If the public access block is not attached it defaults to False

Yes
High
AWS

AWS ElastiCache Redis cluster should have encryption at rest enabled

ElastiCache for Redis offers default encryption at rest as a service, as well as the ability to use your own symmetric customer-managed customer master keys in AWS Key Management Service (KMS). For compliance reasons and as a best practice, it's best to make use of this.

Yes
Medium
AWS

AWS ElastiCache Replication Group should encrypt data in transit and enable Redis AUTH

Securing an Amazon ElastiCache Redis cluster requires protecting data over the network and restricting command execution. Redis AUTH prevents unauthorized access by requiring users to provide a password before executing commands. Because AWS mandates that in-transit encryption be active before authentication can be enabled, securing the replication group requires simultaneously enabling transit encryption and configuring an authentication token.

No
Medium
AWS

Amazon EKS Clusters should have control plane logging enabled

It is recommended to enable all control plane logging types for Amazon EKS clusters. This will help in troubleshooting and auditing EKS clusters. For example, you will be able to see the workloads that access Kubernetes secrets. The logs will be sent to CloudWatch.

Yes
Low
AWS

Amazon EKS Clusters public endpoints should not allow traffic from any IP

If you need to access the Kubernetes API server endpoint over the internet, it is recommended to allow traffic from a specific IP address or range of IP addresses. This can help prevent unauthorized access to the API server. By default, the Kubernetes API server endpoint is accessible from any IP address (0.0.0.0/0).

Yes
Low
AWS

Amazon EKS Clusters should have secrets encryption enabled

Kubernetes secrets are stored unencrypted in etcd. It is recommended to encrypt Kubernetes secrets in Amazon EKS clusters. This will help in securing the secrets and preventing unauthorized access to them.

Yes
Medium
AWS

AWS EKS Node groups have implicit SSH access from any IP

By default, EKS node groups allow SSH access from 0.0.0.0/0. This greatly increases the attack surface of your cluster. It is recommended to limit the source IPs that can SSH into the EKS nodes, or disable the node group SSH access altogether.

Yes
Medium
AWS

AWS MQBroker version is outdated

It's recommended to keep the version of your MQBroker up to date so that it gets regular security fixes and checks.

No
Medium
AWS

AWS IAM policy document allows any action

The Action element describes the specific action or actions that will be allowed or denied. Statements must include either an Action or NotAction element. Each AWS service has its own set of actions that describe tasks that can be performed with that service. Specify a value using a namespace that identifies a service, for example, iam, ec2 sqs, sns, s3, followed by the name of the action to be allowed or denied. The name must match an action that is supported by the service.

No
Medium
AWS

IAM Policy has asterisks (*) in statement's allowed actions

An IAM Policy was found which has access to several actions, indicated by the use of asterisks (*) in the statement's allowed actions. This is not recommended, as it may grant access to new permissions in the future. Besides that, the allowed actions should be restricted by what's strictly needed for the users or roles of the IAM policy.

No
Medium
AWS

IAM Policy allows full administrative privileges

This IAM policy grants full administrative privileges using wildcard actions and resources. Such broad permissions can lead to unintended access and potential misuse.

No
Medium
AWS

API Gateway endpoints do not require an API key or authorization

One or more HTTP or REST API Gateway endpoints are publicly accessible without requiring an API key or authorization. This can expose APIs to unauthorized access, abuse, or data exfiltration.

No
High
AWS

API Gateway stages are not using TLS 1.2 or higher

One or more API Gateway stages are configured to use TLS versions lowe than 1.2. Older TLS versions have known vulnerabilities that can compromise the security of data in transit.

No
Medium
AWS

API Gateway REST API caching is unencrypted

One or more API Gateway REST APIs have caching enabled without encryption. Unencrypted cache data may expose sensitive information to unauthorized access or inspection.

No
Medium
AWS

S3 bucket grants public access to all contents

The affected S3 bucket is configured to allow public access to its contents. This means that either unauthenticated users (anyone on the internet) or any AWS account (accounts unrelated to your organization) can list, read, or possibly write to the bucket.

No
High
AWS

RDS database instance is publicly accessible

AWS RDS instances should not be publicly accessible to minimize the risk of unauthorized external access, brute-force attacks, and data breaches. Database traffic should be restricted to resources within your VPC or specific trusted internal networks.

No
Medium
AWS

RDS database automated backups not configured

AWS RDS supports automated backups to allow for point-in-time recovery of your databases. As a best practice for disaster recovery and data retention, the backup retention period should be enabled and configured to a value between 1 and 35 days.

No
Low
AWS

Ensure all data stored in the RDS is securely encrypted at rest

Amazon RDS offers out-of-the-box encryption at rest for database instances using AWS Key Management Service (KMS). This ensures that the underlying storage, automated backups, read replicas, and snapshots are encrypted. For compliance reasons and as a best practice, it's best to turn this on.

No
Medium
GCP

GCP Kubernetes engine clusters vulnerable to SSRF attacks

The GCE instance metadata API is used by GKE nodes to fetch the node's credentials. These instances should use a newer version of the API. The old version is vulnerable to SSRF attacks because it allows simple GET requests to fetch the credentials.

No
High
GCP

Cloud SQL db not enforcing SSL

Cloud SQL creates a server certificate automatically when a new instance is created. Not enforcing this means that your traffic might not be encrypted in transit.

Yes
High
GCP

Default network exists in GCP project

Google Cloud projects are created with a default VPC network that includes automatically generated firewall rules allowing broad ingress access. Retaining the default network increases the attack surface, as any service could communicate with another (potentially higher privileged) service.

No
Low
GCP

Cloud Storage bucket is publicly accessible

Google Cloud Storage buckets can be configured to allow anonymous or public access through IAM policies or legacy ACLs. Publicly accessible buckets may expose sensitive data and increase the risk of data leakage or unauthorized access.

No
High
GCP

Cloud Storage bucket does not enforce uniform bucket-level access

Google Cloud Storage buckets without uniform bucket-level access enabled allow the use of legacy bucket and object ACLs alongside IAM policies. This can result in fragmented and overly permissive access controls, increasing the risk of unintended public or anonymous access to stored data.

No
Low
GCP

Cloud Storage bucket does not enforce public access prevention

Google Cloud Storage buckets that do not enforce public access prevention may allow public or anonymous access through IAM policies or legacy access mechanisms. This increases the risk of unintended data exposure and violates the principle of least privilege.

No
Medium
GCP

Pub/Sub topic is anonymously or publicly accessible

Google Cloud Pub/Sub topics can be configured with IAM bindings or members that allow access to allUsers or allAuthenticatedUsers. Publicly accessible Pub/Sub topics may allow unauthorized publishers or subscribers to interact with messaging workflows.

No
High
GCP

Firewall rules allow unrestricted SSH access

Google Compute Engine firewall rules were found allowing inbound SSH access (port 22) from unrestricted IP ranges such as 0.0.0.0/0 or ::/0. Allowing unrestricted SSH access significantly increases the attack surface and exposes virtual machines to brute-force attacks / internet-wide scanning activity.

No
High
GCP

Vertex AI notebook instance has a public IP address

Google Vertex AI notebook instances can be configured with a public IP address, making them directly reachable from the internet. Publicly accessible notebook instances increase the attack surface.

No
Medium
GCP

BigQuery table is anonymously or publicly accessible

Google BigQuery tables can be configured with IAM bindings or members that grant access to allUsers or allAuthenticatedUsers. Publicly accessible BigQuery tables may expose sensitive analytical data, increase the risk of data exfiltration, and violate the principle of least privilege.

No
High
GCP

Firewall rules allow unrestricted RDP access

Google Compute Engine firewall rules were found allowing inbound RDP access (port 3389) from unrestricted IP ranges such as 0.0.0.0/0 or ::/0. Allowing unrestricted RDP access significantly increases the attack surface and exposes Windows virtual machines to brute-force attacks, and internet-wide scanning activity.

No
High
GCP

KMS cryptographic key policy allows public access

Google Cloud KMS cryptographic keys can be configured with IAM policies that grant access to allUsers or allAuthenticatedUsers. Publicly accessible KMS keys may allow unauthorized encryption or decryption operations, leading to severe data exposure, integrity compromise, or loss of control over protected secrets.

No
High
GCP

Dataproc cluster is anonymously or publicly accessible

Google Cloud Dataproc clusters can be configured with IAM bindings or members that grant access to allUsers or allAuthenticatedUsers. Publicly accessible Dataproc clusters may expose sensitive data processing workloads, configuration details, and underlying compute resources to unauthorized access.

No
High
AZURE

Azure Cognitive Services allows public network access

Disabling the public network access property improves security by ensuring your Azure Cognitive Services can only be accessed from a private endpoint. This configuration strictly disables access from any public address space outside of Azure IP range and denies all logins that match IP or virtual network-based firewall rules.

Yes
Medium
AZURE

Azure Key Vault allows public network access

Disabling the public network access property improves security by ensuring your Azure Key Vault can only be accessed from a private endpoint. This configuration strictly disables access from any public address space outside of Azure IP range and denies all logins that match IP or virtual network-based firewall rules.

Yes
Medium
AZURE

AKS API server does not limit access by IP ranges

The AKS API server receives requests to perform actions in the cluster, for example, to create resources, and scale the number of nodes. The API server provides a secure way to manage a cluster. To enhance cluster security and minimize attacks, the API server should only be accessible from a limited set of IP address ranges. These IP ranges allow defined IP address ranges to communicate with the API server. A request made to the API server from an IP address that is not part of these authorized IP ranges is blocked.

No
High
AZURE

AKS local admin account is still enabled

Disabling the local admin account for your Azure Kubernetes Service (AKS) cluster can help improve the security of your cluster. The local admin account has full access to all resources within the cluster, and can make any changes to the cluster and its contents.

Yes
High
AZURE

No AKS cluster upgrade channel is chosen

In the latest AKS Provider for Terraform you have the option to define automatic Kubernetes upgrade with the following command: automatic_upgrade_channel = patch. Values can be either patch, rapid, or stable.

Yes
High
AZURE

Azure Storage Account allow public access

As a best practice, do not allow anonymous/public access to storage accounts unless you have a very good reason. The all networks option includes the entire internet.

Yes
High
AZURE

Azure Storage Accounts does not enforce latest TLS version

Azure Storage accounts permit clients to send and receive data with the oldest version of TLS, TLS 1.0, and above. To enforce stricter security measures, you can configure your storage account to require that clients send and receive data with a newer version of TLS

Yes
Medium
AZURE

Azure Storage blobs do not restrict public access for nested items

Azure Storage blobs should have a default public access block enabled to make sure they cannot be made public accidentally. If the public access block is not attached it defaults to False

Yes
High
AZURE

SQL Server is publicly reachable

Disabling the public network access property improves security by ensuring your SQL Server can only be accessed from a private endpoint. This configuration strictly disables access from any public address space outside of Azure IP range and denies all logins that match IP or virtual network-based firewall rules.

No
High
AZURE

Azure Cosmos DB is publicly reachable

A publicly accessible Azure Cosmos DB instance unnecessarily increases the attack surface of your organization. Limit public access of the Cosmos DB instance to ensure that the attack surface is limited.

No
Low
AZURE

Azure Cosmos DB local authentication is enabled

Local authentication for Azure Cosmos DB allows access using account keys instead of Azure AD or managed identities. Disabling local authentication reduces the risk of unauthorized access or credential misuse by ensuring only MSI and AAD can be used for authentication.

No
Low
AZURE

Ensure Azure Instance does not use basic authentication

Disable password-based authentication on Azure virtual machines to enforce the use of SSH keys, reducing the risk of credential guessing, brute-force attacks, or compromised passwords.

No
Medium
AZURE

Firewall rules allow SSH from any public IP

Inbound network security group (NSG) rules were found allowing SSH (port 22) access from 0.0.0.0/0 or ::/0. Allowing unrestricted public access exposes Azure virtual machines to brute-force attempts, scanning activities, and unauthorized access.

No
High
AZURE

Firewall rules allow RDP access from any public IP

Inbound network security group (NSG) rules were found allowing RDP (port 3389) access from 0.0.0.0/0 or ::/0. Allowing unrestricted public access exposes Azure virtual machines to brute-force attempts, scanning activities, and unauthorized access.

No
High
AZURE

Storage account does not enforce HTTPS-only traffic

By default, since most recent API versions, Microsoft Storage Accounts, the value of the attribute 'supportsHttpsTrafficOnly' is by default false. You have expliclty set this property to false, or are using an older API of Azure. Allowing unencrypted HTTP connections exposes data in transit to interception, tampering, and downgrade attacks.

No
High
AZURE

Key Vault is publicly accessible

Azure Key Vault allows public network access when network restrictions are not explicitly configured. In order to reduce the attack surface of your Key Vault instance, disable public network access by configuring network ACLs.

No
Low
Docker

Unverified packages installed in Docker image

APK packages are being installed in Docker with the --allow-untrusted flag. This allows packages with missing or unverified signatures to be installed. This could lead to supply chain attacks.

No
Low
Docker

Automatic upgrades of base Docker images can lead to supply chain attacks

It's recommended to pin the version of base images inside of Docker containers. Using a dynamic version can cause unexpected behavior and at worst, can lead to supply chain attacks. On top of that the 'latest' tag does not always automatically refer to the newest version of the image, so it can also lead to using an outdated version of the base image.

Yes
High
Docker

Docker container runs as default root user

By default, containers are run with root privileges and also run as the root user inside the container. Running the app as root gives a hacker who was able to hack the application instant root access to the Docker host, which could help them to escalate a hack.

Yes
Medium
Docker

Docker container configured to run as user with root privileges

Running the app as root gives a hacker who was able to hack the application instant root access to the Docker host, which could help them to escalate a hack.

Yes
Medium
Kubernetes

Automatic upgrades of base Docker images can lead to supply chain attacks

It's recommended to pin the version of base images inside of Docker containers. Using a dynamic version can cause unexpected behavior and at worst, can lead to supply chain attacks. On top of that the 'latest' tag does not always automatically refer to the newest version of the image, so it can also lead to using an outdated version of the base image.

Yes
High
Kubernetes

Filesystem for docker container should not be writeable

Allowing a writeable root filesystem can allow attackers to make their presence on your machine permanent by writing to the disk. Your container should only write to mounted volumes or to databases or managed services (such as S3) to store data. If you need a temporary cache, consider using tmpfs.

Yes
Medium
Kubernetes

Container running as root can allow attacker to escalate attacks

Containers running as root usually have way more permissions than their workload requires. An attacker that can take control of your application will instantly also have root access on your container, which makes next steps for the attacker easier. Next steps usually involve maintaining presence for a longer time or moving to other services within your network.

Yes
High
Kubernetes

Privileged container can allow attackers to escalate attacks

Privileged containers have access to more resources than normal containers. This is usually only required for special use cases such as running a Docker daemon inside of a Docker container or to get more direct hardware access..

Yes
Medium
Kubernetes

Container processes can gain more privileges than its parent

Setting AllowPrivilegeEscalation to True allows child processes of a container to gain more privileges than its parent.

Yes
Medium
Kubernetes

Dangerous Impersonate permission given to ServiceAccount or node

In Kubernetes, the impersonate permission allows a user or service account to perform actions as if they were another user or service account. This can be useful in certain situations, such as when one service needs to access another service on behalf of a user. However, allowing a ServiceAccount or Node to have impersonate permissions for other users or service accounts can potentially allow privilege escalation.

No
Critical
Kubernetes

ServiceAccount or node can read all secrets

Allowing a ServiceAccount to read all secrets could pose a security risk to the cluster, as it could potentially allow unauthorized access to sensitive information.

No
High
Kubernetes

Kubernetes dashboard might be deployed

In mid-2019 Tesla was hacked where their kube-dashboard was exposed to the internet. Hackers browsed around, found credentials, and deployed pods running bitcoin mining software. We recommend you disable the kube-dashboard if it's not needed, to prevent the need to manage its individual access interface and limit it as an attack vector. This rule also triggers for images such as grafana.

No
High
Kubernetes

Default security context allows pods to access host system.

Security Context restricts the actions a pod can take. This is especially important if you are running workloads from untrusted users.

No
Medium
Kubernetes

Default Kubernetes settings allow containers to eavesdrop on traffic.

The Docker runtime enables NET_RAW by default. It can be abused by malicious containers to eavesdrop on network traffic or generate IP traffic with spoofed addresses.

Yes
Medium
Ansible

Signature validation is off and packages are not locked

The force parameter for apt is used. It disables signature validation and allows packages to be downgraded which can leave the system in a broken or inconsistent state.

No
Medium
Ansible

Outbound Ansible connections are not encrypted

You are using get_url without https.

No
Medium
Ansible

Outbound Ansible connections are not encrypted

You are using uri without https.

No
Medium
Ansible

Signature validation for dnf packages is off

You are using dnf to install packages, but the default gpg package validation checks have been turned off.

No
Medium
Pulumi - js

Azure Network Security Rule allows plaintext HTTP connections

This vulnerability occurs when Azure Network Security Rules permit HTTP (port 80) traffic from the internet. This prevents unencrypted HTTP connections, protecting data in transit from interception, tampering, or man-in-the-middle attacks. Enforcing HTTPS-only access is a key security best practice for safeguarding storage account communications and maintaining compliance with data protection standards.

No
Low
Pulumi - js

Public Network Access in Azure Storage Account is risky

An Azure Storage Account was configured to allow anonymous public read access, which means anyone on the internet can list and read blob data without needing authentication. While this setting is suitable for public content, such as website assets, it represents a serious misconfiguration for sensitive or private data. Allowing this access bypasses all authentication mechanisms, exposing all data within the container to the public.

No
Low
Pulumi - js

Public Network Access in Azure Key Vault is risky

Azure Key Vault's default configuration allows public network access from any IP address or service. It can expose sensitive secrets, keys, and certificates to unauthorized internet-based threats or accidental breaches.

No
Medium
Pulumi - js

Public Network Access in Azure Cache for Redis is risky

The Azure Cache for Redis instance is configured with public access, allowing unrestricted internet access to the in-memory data store. This configuration can expose sensitive cached data, including session tokens and database query results. If uncovered, attackers can connect directly to the Redis server over the internet and easily extract the data.

No
Low
Pulumi - js

Azure Container Registry Admin Account Enabled

The Azure Container Registry admin account is a legacy authentication method granting full permissions, creating a security risk. If compromised, attackers gain unrestricted access to manipulate container images and repositories. This bypasses Azure AD authentication and auditing controls. Disabling the admin account enforces individual Azure AD identities for granular security and access management.

No
Low
Pulumi - js

Insecure Authentication: Password-Based Logon Enabled on Azure VM

Leaving password authentication enabled on Azure VMs exposes them to credential-based attacks. Attackers can exploit weak, reused, or stolen passwords to gain unauthorized access. This bypasses stronger protections like Azure AD or SSH keys, increasing risks of data breaches or system compromise.

No
Low
Pulumi - js

Azure VM Host-Based Encryption Disabled

Host-based encryption ensures all VM disks, including temporary storage, are encrypted at the host level. If disabled, data on disks and caches remains unencrypted. This exposes sensitive information to unauthorized access if the underlying infrastructure is compromised.

No
Low
Pulumi - js

Absence of geo-redundant backups in Azure PostgreSQL detected.

The Azure PostgreSQL server is configured with locally redundant backups. This means backups are only stored within a single region's data center. In the event of a catastrophic regional failure, all backup data would be lost. This configuration fails to ensure business continuity and data recoverability.

No
Low
Pulumi - PY

Azure managed disk has no encryption enabled

Azure Managed Disks should be properly encrypted using either platform-managed or customer-managed keys. Ensure that the encryption_settings or encryption_settings_collection properties are correctly configured in Pulumi. Unencrypted or weakly configured disks create the risk of unauthorized data access in case of snapshot leaks, data exfiltration, or disk exposure.

No
Medium
Pulumi - js

Azure managed disk has no encryption enabled

Azure Managed Disks should be properly encrypted using either platform-managed or customer-managed keys. Ensure that the encryptionSettings or encryptionSettingsCollection properties are correctly configured in Pulumi. Unencrypted or weakly configured disks create the risk of unauthorized data access in case of snapshot leaks, data exfiltration, or disk exposure.

No
Medium
Pulumi - PY

Azure Storage Account allows plaintext HTTP connections

Ensure that Azure Storage Accounts are configured to accept only secure HTTPS traffic by setting enable_https_traffic_only to true (default value). This prevents unencrypted HTTP connections, protecting data in transit from interception, tampering, or man-in-the-middle attacks. Enforcing HTTPS-only access is a key security best practice for safeguarding storage account communications and maintaining compliance with data protection standards.

No
Medium
Pulumi - js

Azure Storage Account allows plaintext HTTP connections

Ensure that Azure Storage Accounts are configured to accept only secure HTTPS traffic by setting enableHttpsTrafficOnly to true (default value). This prevents unencrypted HTTP connections, protecting data in transit from interception, tampering, or man-in-the-middle attacks. Enforcing HTTPS-only access is a key security best practice for safeguarding storage account communications and maintaining compliance with data protection standards.

No
Medium
Pulumi - PY

Azure Network Security Rule allows plaintext HTTP connections

This vulnerability occurs when Azure Network Security Rules permit HTTP (port 80) traffic from the internet. This prevents unencrypted HTTP connections, protecting data in transit from interception, tampering, or man-in-the-middle attacks. Enforcing HTTPS-only access is a key security best practice for safeguarding storage account communications and maintaining compliance with data protection standards.

No
Low
Pulumi - PY

Public Network Access in Azure Key Vault is risky

Azure Key Vault's default configuration allows public network access from any IP address or service. It can expose sensitive secrets, keys, and certificates to unauthorized internet-based threats or accidental breaches.

No
Medium
Pulumi - PY

Public Network Access in Azure Cache for Redis is risky

The Azure Cache for Redis instance is configured with public access, allowing unrestricted internet access to the in-memory data store. This configuration can expose sensitive cached data, including session tokens and database query results. If uncovered, attackers can connect directly to the Redis server over the internet and easily extract the data.

No
Low
Pulumi - PY

Public Network Access in Azure Storage Account is risky

An Azure Storage Account was configured to allow anonymous public read access, which means anyone on the internet can list and read blob data without needing authentication. While this setting is suitable for public content, such as website assets, it represents a serious misconfiguration for sensitive or private data. Allowing this access bypasses all authentication mechanisms, exposing all data within the container to the public.

No
Low
Pulumi - PY

Azure Container Registry Admin Account Enabled

The Azure Container Registry admin account is a legacy authentication method granting full permissions, creating a security risk. If compromised, attackers gain unrestricted access to manipulate container images and repositories. This bypasses Azure AD authentication and auditing controls. Disabling the admin account enforces individual Azure AD identities for granular security and access management.

No
Low
Pulumi - PY

Insecure Authentication: Password-Based Logon Enabled on Azure VM

Leaving password authentication enabled on Azure VMs exposes them to credential-based attacks. Attackers can exploit weak, reused, or stolen passwords to gain unauthorized access. This bypasses stronger protections like Azure AD or SSH keys, increasing risks of data breaches or system compromise.

No
Low
Pulumi - PY

Azure VM Host-Based Encryption Disabled

Host-based encryption ensures all VM disks, including temporary storage, are encrypted at the host level. If disabled, data on disks and caches remains unencrypted. This exposes sensitive information to unauthorized access if the underlying infrastructure is compromised.

No
Low
Pulumi - PY

Absence of geo-redundant backups in Azure PostgreSQL detected.

The Azure PostgreSQL server is configured with locally redundant backups. This means backups are only stored within a single region's data center. In the event of a catastrophic regional failure, all backup data would be lost. This configuration fails to ensure business continuity and data recoverability.

No
Low
    