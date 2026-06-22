Language

Description

AutoFix

Score


JS

Serving JS code from a malicious domain

Aikido found references to a malicious domain (e.g. polyfill[.]io, bootcss[.]net). You may be embedding its scripts in your application. The domains are owned by an entity known for serving malicious code.

Yes
Critical
YAML

Use of vulnerable ingress-nginx controller

Using an ingress-nginx controller below version v1.12.1 and below version v1.11.5 is vulnerable to CVE-2025-1974. This critical vulnerability allows attackers on the Pod network to exploit configuration injection vulnerabilities via the Validating Admission Controller feature, potentially leading to complete cluster takeover without requiring credentials or administrative access.

No
Critical
YAML

Use of vulnerable ingress-nginx controller

Using an ingress-nginx controller below version v1.12.1 and below version v1.11.5 is vulnerable to CVE-2025-1974. This critical vulnerability allows attackers on the Pod network to exploit configuration injection vulnerabilities via the Validating Admission Controller feature, potentially leading to complete cluster takeover without requiring credentials or administrative access.

No
Critical
terraform

Missing owner reference for AWS AMI may lead to a supply chain attack

There is a risk that an unintended image from an untrusted source could be selected, as you do not use a filter for the AMI based on the image_id or owner_id and use the most_recent attribute. If a malicious AMI is published and used by your EC2 machine, it may be launched with a malicious image.

Yes
Critical
yaml

tj-actions/changed-files was compromised, exfiltrated secrets

tj-actions/changed-files was compromised and exfiltrated secrets. If your pipeline tagged the GitHub Action by a version number (as opposed to the commit hash of a release), you should assume that the secrets in your pipeline are compromised. Revoke your tokens and audit the logs of the relevant (3rd party) services. The malicious actor updated release tags of all versions, pointing to the malicious commit of the actor.

No
Critical
PHP

Eloquent ORM does not block cross-customer data access

If you are hosting a web application for one single customer, you can safely ignore this issue. However, if you are hosting a multi-tenant SaaS (multiple customers in one database), you must take special precautions to make sure data from one tenant cannot be read or written to by another customer. Eloquent ORM has a feature called global scopes that can help by enforcing a tenant condition check on every database query. We detected that you are not using any Eloquent global scope conditions using the addGlobalScope() function.

No
Critical
Swift

A potential Swift command injection vulnerability has been identified due to the construction of an operating system command with user-controlled input.

Constructing an OS command with unsanitized user input poses significant security risks. A malicious actor could exploit this vulnerability to manipulate the input to inject or execute arbitrary code.

No
Critical
PHP

Using phpinfo() can expose sensitive info to users

Using phpinfo() can expose the entire server configuration to your users, including every environment variable.

Yes
Critical
Java

XXE attack can lead to remote code execution

XMLDecoder should not be used to parse untrusted data. Deserializing user input can lead to arbitrary code execution. See background link for alternatives and vulnerability prevention.

No
Critical
Java

Turning off TLS verification enables man-in-the-middle attacks

TLS/SSL certificate verification functions were redefined. This should only be used for debugging purposes because it leads to vulnerability to Man-In-The-Middle attacks.

Yes
Critical
Java

JSON Web Token verification is turned off

The 'none' algorithm assumes the integrity of the token has already been verified. This would allow a malicious actor to forge a JWT token that will automatically be verified.

No
Critical
.NET

Possible command injection via Process.Start

OS command injection is a critical vulnerability that can lead to a full system compromise as it may allow an adversary to pass in arbitrary commands or arguments to be executed.

Yes
Critical
VB

Possible command injection via Process.Start

OS command injection is a critical vulnerability that can lead to a full system compromise as it may allow an adversary to pass in arbitrary commands or arguments to be executed.

No
Critical
dart

Potential command injection via Process.run

OS command injection is a critical vulnerability that can lead to a full system compromise as it may allow an adversary to pass in arbitrary commands or arguments to be executed.

No
Critical
.NET

Cached data may be served to the wrong users

Having the annotation [OutputCache] will disable the annotation [Authorize] for the requests following the first one. This may result in cached data from the first request being shown to other authorized users.

Yes
Critical
.NET

LDAP query injection may lead to data exposure

LDAP injection attacks exploit LDAP queries to influence how data is returned by the LDAP, or in this case an Entra ID (Active Directory) server. It is recommended that newer applications use the `System.DirectoryServices.AccountManagement` API instead of `DirectorySearcher` API as it hides the complexity of querying LDAP directly.

Yes
Critical
TS

Remote Code Execution possible via eval()-type functions

Using functions such as eval, but also less obvious functions such as setTimeout, setInterval or 'new Function' can lead to users being able to run their own code on your servers.

No
Critical
JS

Remote Code Execution possible via eval()-type functions

Using functions such as eval, but also less obvious functions such as setTimeout, setInterval or 'new Function' can lead to users being able to run their own code on your servers.

No
Critical
Ruby

Remote Code Execution possible via eval()-type functions

Using functions such as eval can lead to users being able to run their own code on your servers.

No
Critical
Elixir

Using binary_to_term can lead to RCE

Using binary_to_term with user input can lead to remote code execution.

Yes
Critical
Elixir

Using eval on potential user input can leads to RCE

Potential user input is passed to one of Elixir's code evaluation methods. This may lead to remote code execution.

Yes
Critical
GO

App might be vulnerable to Zip Slip attack

The application may be vulnerable to a path traversal attack while unzipping untrusted archives. This vulnerability is colloquially known as 'Zip Slip'. This is exploited by including path traversal characters such as '../../other/directory' to overwrite or place files in system or application directories.

Yes
Critical
GO

App might expose entire file system

The application is potentially exposing the entire file system by mounting the root directory '/' to an HTTP handler function via http.Dir('/'). Anyone who is able to access this HTTP server may be able to access any file that the HTTP server has access to.

No
Critical
Clojure

Possible command injection via user-controlled input to clojure.java.shell/sh

OS command injection is a critical vulnerability that can lead to a full system compromise as it may allow an adversary to pass in arbitrary commands or arguments to be executed.

No
Critical
JS

LDAP query injection may lead to data exposure

LDAP injection attacks exploit LDAP queries to influence how data is returned by the LDAP, or in this case an Entra ID (Active Directory) server. An attacker can inject LDAP metacharacters (e.g. *, ), \00) to alter the filter logic, bypass authentication by crafting expressions like *)(uid=*))(|(uid=*, enumerate directory objects, or exfiltrate sensitive attributes from the directory server. This is particularly dangerous in Active Directory environments where successful injection can expose user credentials, group memberships, and organizational structure.

No
Critical
VB

LDAP query injection may lead to data exposure

LDAP injection attacks exploit LDAP queries to influence how data is returned by the LDAP, or in this case an Entra ID (Active Directory) server. It is recommended that newer applications use the System.DirectoryServices.AccountManagement API instead of DirectorySearcher API as it hides the complexity of querying LDAP directly.

No
Critical
PHP

Using var_dump() can expose sensitive info to users

Using var_dump() can expose private data to end users. This is likely a debug statement that was accidentally committed.

Yes
Critical
PHP

Using backticks in PHP can lead to remote code execution

Backticks (``) in PHP are very dangerous and counterintuitive. These are not single quotes ('). PHP automatically attempts to execute the contents of the backticks as a shell command and the output will be returned. The shortest PHP line that can lead to Remote Code Execution is as tiny as `$_GET[2]`.

Yes
Critical
Java

XML based XXE attack possible

XML external entities are enabled for this XMLInputFactory. Loading external XML will be vulnerable to XML external entity attacks. This can expose internal files externally and lead to other types of exploits.

No
Critical
.NET

XML-based XXE attack possible

External XML entities are a feature of XML parsers that allow documents to reference external files or resources. When enabled, this functionality can be abused to read local files, communicate with external hosts, exfiltrate sensitive data, or trigger Denial of Service (DoS) conditions. Since .NET Framework 4.5.2, the default XML parser settings are designed to be safe, so applications that rely on these defaults and do not override them are generally not vulnerable to XXE attacks.

Yes
Critical
Java

Usage of HttpInvokerServiceExporter can lead to remote code execution

The readRemoteInvocation method in HttpInvokerServiceExporter.class does not properly verify or restrict untrusted objects prior to deserializing them. An attacker can exploit this vulnerability by sending malicious requests containing crafted objects, which when deserialized, execute arbitrary code on the vulnerable system.

No
Critical
TS

Unsafe yaml load can lead to remote code execution

js-yaml has the ability to construct an arbitrary JS object. This is dangerous if you receive a YAML document from an untrusted source.

No
Critical
TS

User data used in Puppeteer methods can result in SSRF

If unverified user data can reach the Puppeteer methods it can result in Server-Side Request Forgery vulnerabilities. This kind of attack can be leveraged to gain more access to further cloud resources, in some cases.

No
Critical
TS

Insecure gRPC connection can lead to remote code execution

You're using an insecure gRPC connection. This creates a connection without encryption to a gRPC client/server. A malicious attacker could tamper with the gRPC message, which could compromise the machine.

No
Critical
JS

Unsafe yaml load can lead to remote code execution

js-yaml has the ability to construct an arbitrary JS object. This is dangerous if you receive a YAML document from an untrusted source.

No
Critical
JS

User data used in Puppeteer methods can result in SSRF

If unverified user data can reach the Puppeteer methods it can result in Server-Side Request Forgery vulnerabilities. This kind of attack can be leveraged to gain more access to further cloud resources, in some cases.

No
Critical
JS

Insecure gRPC connection can lead to remote code execution

You're using an insecure gRPC connection. This creates a connection without encryption to a gRPC client/server. A malicious attacker could tamper with the gRPC message, which could compromise the machine.

No
Critical
PY

Using Pickle can lead to remote code execution

Unlike JSON, it is possible to construct malicious Pickle data which can execute attacker-controller code during loading of data (unpickling).

No
Critical
GO

Profiling endpoint automatically exposed on /debug/pprof

importing net/http/pprof might expose an interface meant for developers to the public internet. This could reveal function names and file paths, as well as other sensitive information.

Yes
Critical
PY

Using deprecated cryptographic library

The pyCrypto library and its module RSA are no longer actively maintained and have been deprecated.

Yes
Critical
PY

Unsafe eval usage can lead to remote code execution

Using eval on expressions based on user input can execute arbitrary code.

Yes
Critical
PY

Using Marshal can lead to remote code execution

Unlike JSON, it is possible to construct malicious Marshal data which can execute attacker-controller code during loading of data (unpickling).

No
Critical
PY

Unsafe yaml load can lead to remote code execution

Yaml.load() has the ability to construct an arbitrary Python object. This is dangerous if you receive a YAML document from an untrusted source.

Yes
Critical
Kotlin

Handling potential user-controlled inputs into java.lang.Runtime calls can lead to command injection.

Using `java.lang.Runtime` methods with unsanitized user input introduces a command injection vulnerability. An attacker can exploit this by submitting crafted input that breaks the intended command, allowing them to execute arbitrary code on the underlying operating system. It can compromise the host, resulting in data theft, service interruption, or further attacks.

No
Critical
VB

XML External Entity (XXE) attack possible

External XML entities are a feature of XML parsers that allow documents to reference external files or resources. When enabled, this functionality can be abused to read local files, communicate with external hosts, exfiltrate sensitive data, or trigger Denial of Service (DoS) conditions. Since .NET Framework 4.5.2, the default XML parser settings are designed to be safe, so applications that rely on these defaults and do not override them are generally not vulnerable to XXE attacks.

No
Critical
JS

Potential leakage of sensitive environment variables in Vite loadEnv misconfiguration

The application improperly configured Vite’s `loadEnv` method with an empty prefix filter, causing all CICD environment variables, potentially including sensitive secrets, tokens, and credentials, to be embedded into the client-side bundle and publicly exposed. An attacker could inspect the generated JavaScript assets or browser source code to retrieve credentials, API keys, or internal service secrets, potentially leading to unauthorized access, supply-chain compromise, or further infrastructure attacks.

Yes
Critical
PHP

Unsafe exec usage can lead to remote code execution

Using exec with expressions based on user input can execute arbitrary code.

Yes
High
PHP

Unsafe eval usage can lead to remote code execution

Using eval on expressions based on user input can execute arbitrary code.

No
High
PHP

Using unserialize can lead to remote code execution

Using unserialize is well known for causing remote code execution issues when unserializing untrusted input. This is caused by unserialize's support for creation of random PHP objects.

No
High
PHP

Rendering unescaped input can lead to XSS attacks

Outputting user input using echo() risks cross-site scripting vulnerability. This could in turn be used to facilitate account takeover attacks.

Yes
High
PHP

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

No
High
Java

Object deserialization can lead to remote code execution

Deserializing entire Java objects is dangerous because malicious actors can create Java object streams with unintended consequences. Ensure that the objects being deserialized are not user-controlled. If this must be done, consider using HMACs to sign the data stream to make sure it is not tampered with, or consider only transmitting object fields and populating a new object.

No
High
Java

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

No
High
Java

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

No
High
.NET

Object deserialization can lead to remote code execution

Deserializing objects is dangerous because attackers can create malicious object files with unintended consequences. Ensure that the objects being deserialized are not user-controlled. Microsoft recommends no longer using the following serialization formats: BinaryFormatter, SoapFormatter, NetDataContractSerializer, LosFormatter and ObjectStateFormatter. If this must be done, consider using HMACs to sign the data stream to make sure it is not tampered with, or consider only transmitting object fields and populating a new object.

No
High
Scala

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

No
High
TS

Potential file inclusion attack via file path construction

If an attacker can control the input leading into a path construction function such as join() or resolve() and this path is later used in a function such as ReadFile(), they might be able to read sensitive files and launch further attacks with that information.

Yes
High
TS

NoSQL injection attack possible

Query injection attacks are possible if users can pass objects instead of strings to query functions such as findOne. By injecting query operators attackers can control the behavior of the query, allowing them to bypass access controls and extract unauthorized data. Consider the attack payload `?user_id[$ne]=5`: if the user_id query parameter is passed to the query function without validation or casting its type, an attacker can pass {$ne: 5} instead of an integer to the query. {$ne: 5} uses the 'not equal to' operator to access data of other users. While this vulnerability is known as NoSQL injection, relational databases (mysql, postgres) are also vulnerable to this attack if the query library offers a NoSQL-like API and supports string-typed query operators. Examples include prisma and sequelize versions prior to 4.12.0.

Yes
High
C

Potential for OS command injection

It is generally not recommended to call out to the operating system to execute commands. When the application is executing file-system-based commands, user input should never be used in constructing commands or command arguments.

No
High
C

Potential for OS command injection via system call

It is generally not recommended to call out to the operating system to execute commands. When the application is executing file-system-based commands, user input should never be used in constructing commands or command arguments.

No
High
JS

Potential for OS command injection via child_process call

It is generally not recommended to call out to the operating system to execute commands. When the application is executing file-system-based commands, user input should never be used in constructing commands or command arguments.

Yes
High
C

Potential format string vulnerability in syslog() call

Format string vulnerabilities allow an attacker to read or in some cases, potentially write data to and from locations in the processes' memory. To prevent against format string attacks, do not allow users or unvalidated input to provide the format specification.

No
High
C

Use-after-free may lead to RCE

Referencing memory after it has been freed can cause a program to crash, use unexpected values, or execute code.

Yes
High
C

Use-after-free may lead to RCE

Referencing memory after it has been freed can cause a program to crash, use unexpected values, or execute code.

No
High
Java

Unsafe eval usage can lead to remote code execution

The app executes an argument using a `ScriptEngine`'s `eval` method. This may allow for direct OS commands to be executed as it's possible to pass in strings such as `java.lang.Runtime.getRuntime().exec('/bin/sh ...');`.

No
High
JS

Potential file inclusion attack via file path construction

If an attacker can control the input leading into a path construction function such as join() or resolve() and this path is later used in a function such as ReadFile(), they might be able to read sensitive files and launch further attacks with that information.

Yes
High
JS

NoSQL injection attack possible

Query injection attacks are possible if users can pass objects instead of strings to query functions such as findOne. By injecting query operators attackers can control the behavior of the query, allowing them to bypass access controls and extract unauthorized data. Consider the attack payload `?user_id[$ne]=5`: if the user_id query parameter is passed to the query function without validation or casting its type, an attacker can pass {$ne: 5} instead of an integer to the query. {$ne: 5} uses the 'not equal to' operator to access data of other users. While this vulnerability is known as NoSQL injection, relational databases (mysql, postgres) are also vulnerable to this attack if the query library offers a NoSQL-like API and supports string-typed query operators. Examples include prisma and sequelize versions prior to 4.12.0.

Yes
High
PY

Unsafe exec usage can lead to remote code execution

Using exec with expressions based on user input can execute arbitrary code.

No
High
PY

Unsafe subprocess usage can lead to remote code execution

Using subprocess.Popen with expressions based on user input can execute arbitrary code. This is especially true when shell=true, because it adds the extra danger of shell injection attacks.

Yes
High
GO

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

No
High
GO

Rendering unescaped input can lead to XSS attacks

Using HTML template rendering functions such as HTML, URL,.. can pass unescaped strings into the output. This means the developer is responsible for allowlisting all HTML strings that can be passed in.

No
High
rust

Potential user input in HTTP request may allow SSRF attack

If an attacker can control the URL input leading into this HTTP request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous if the application returns the response of the request to the user. It could allow them to retrieve information from higher privileged services within the network (such as the metadata service, which is commonly available in cloud services, and could allow them to retrieve credentials).

No
High
Clojure

Arbitrary Code Execution via Unsafe Clojure Deserialization

Using `clojure.core/read` or `read-string` on untrusted data is extremely dangerous because, by default, the `*read-eval*` variable is `true`. It allows the deserialization process to execute arbitrary Clojure code embedded within the data payload. An attacker can exploit this by submitting a maliciously crafted string that, when read, performs actions like shell command execution or file system access.

No
High
Clojure

Unsafe eval usage can lead to remote code execution

Using eval on expressions based on user input can execute arbitrary code.

No
High
VB

Object deserialization can lead to remote code execution

Deserializing objects is dangerous because attackers can create malicious object files with unintended consequences. Ensure that the objects being deserialized are not user-controlled. Microsoft recommends no longer using the following serialization formats: BinaryFormatter, SoapFormatter, NetDataContractSerializer, LosFormatter and ObjectStateFormatter. If this must be done, consider using HMACs to sign the data stream to make sure it is not tampered with, or consider only transmitting object fields and populating a new object.

No
High
kotlin

Broadcasted intents without permissions can be intercepted

By default, broadcasted intents are visible to every application, exposing all sensitive information they contain. Broadcasting intents without specifying any "receiver permission" is dangerous.

No
High
JS

JWT signature is not verified

Affected code paths use 'jsonwebtoken.decode()' to extract and trust JWT claims without cryptographic verification. Because 'decode()' performs no signature validation, attackers can forge or tamper with tokens—manipulating fields like userId, role, or exp—and the application may treat these unverified values as legitimate, leading to authentication bypass or privilege escalation.

No
High
Ruby

JWT signature is not verified or uses unsafe algorithm

Signature verification of the JSON Web Token (JWT) is not performed securely, either because the token uses the unsafe 'none' algorithm or because signature validation is explicitly disabled by setting 'verify' to false.

No
High
PY

JWT signature is not verified or uses unsafe algorithm

Signature of the JSON Web Token (JWT) is not securely verified, either due to use of an unsafe algorithm ('none') or of the insecure configuration 'verify_signature=False'.

Yes
High
rust

Insecure JWT configuration detected: Disabled cryptographic signature validation

JSON Web Tokens (JWT) are a popular standard for authentication and authorization in modern web applications. However, if cryptographic signature validation is improperly disabled, attackers can forge or manipulate tokens, leading to severe security risks—including unauthorized access, privilege escalation, and arbitrary data tampering.

Yes
High
Swift

Allowing XML Parser to resolve external entities is dangerous

Parsing untrusted XML files with a misconfigured parser can lead to XML External Entity (XXE) attacks. These attacks exploit external entity references to access files, execute denial-of-service (DoS) attacks, perform server-side request forgery (SSRF), or exfiltrate sensitive data using out-of-band methods.

Yes
High
JS

Stacktrace might be exposed to end user

An exception is being caught and then sent back via the Express server response. That means sensitive data inside of the exception might become visible in the browser.

No
High
PHP

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
PHP

Potential SQL injection via string-based query concatenation using AuraSQL framework functions

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
PHP

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Ruby

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Ruby

Ruby reflection via constantize may lead to remote code execution

Using constantize in Ruby can convert any string to a class. This may result in a user being able to control runtime behavior, and at worst perform arbitrary remote code execution.

No
High
JS

Express is not emitting security headers

You're using an Express server, but not using Helmet. Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers. Examples are HSTS headers that enforce SSL, CSP headers that protect against XSS attacks. Other headers protect against putting your app in an iframe to launch social engineering attacks which could be used for account takeovers.

Yes
High
Java

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
TS

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
Java

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Java

Potential SQL injection through JDBC via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Java

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

Yes
High
Java

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

Yes
High
Scala

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
.NET

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g. evilsite.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

No
High
Scala

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

No
High
Scala

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

No
High
.NET

Rendering unescaped input can lead to XSS attacks

Outputting user input risks cross-site scripting vulnerability. This could in turn be used to facilitate account takeover attacks.

No
High
.NET

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

Yes
High
dart

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

Yes
High
VB

Path traversal attack possible

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

No
High
TS

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g. evilsite.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

No
High
TS

NodeJS talks to database without encryption

The Sequelize connection string indicates that the database server does not use TLS. This could expose the database password and all data to network sniffing attacks and man-in-the-middle attacks.

Yes
High
C

Insecure stream cipher (RC4)

The RC4 algorithm is vulnerable to many attacks and should no longer be used for encrypting data streams.

No
High
C

Insecure encryption algorithm (DES)

The DES algorithm has not been recommended for over 15 years and was withdrawn from NIST (FIPS 46-3) in 2005.

No
High
JS

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g. evilsite.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

No
High
JS

NodeJS talks to database without encryption

The Sequelize connection string indicates that database server does not use TLS. This could expose the database password and all data to network sniffing attacks and man-in-the-middle attacks.

No
High
JS

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
Ruby

Ruby reflection via send may lead to RCE

You are using the 'send' method on a Ruby object with user input, which allows an attacker to call any method on the object (incl. any defined Kernel methods), which may lead to RCE.

No
High
java

Rendering unescaped input can lead to XSS attacks

Outputting user input risks cross-site scripting vulnerability. This could in turn be used to facilitate account takeover attacks.

Yes
High
.NET

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
VB

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
PY

Using blacklisted XML parsing function is dangerous

The XML parser in `lxml.etree` is vulnerable to to XML attacks (e.g. XML External Entity injection, allowing attackers to exfiltrate local files to a remote resource).

Yes
High
PY

Using blacklisted XML parsing function is dangerous

Using xml.dom.minidom.parse to parse untrusted XML data is known to be vulnerable to XML attacks.

Yes
High
PY

Using blacklisted XML parsing function is dangerous

Using xml.sax.parse to parse untrusted XML data is known to be vulnerable to XML attacks.

Yes
High
PY

Using blacklisted XML parsing function is dangerous

Using xml.etree.ElementTree.parse to parse untrusted XML data is known to be vulnerable to XML attacks.

Yes
High
PY

Flask app debug mode may allow remote code execution

Running Flask applications in debug mode results in the Werkzeug debugger being enabled. This includes a feature that allows arbitrary code execution. Documentation for both Flask and Werkzeug strongly suggests that debug mode should never be enabled on production systems.

Yes
High
PY

Jinja2 template config can lead to XSS attacks

Jinja2 is a Python HTML templating system. It will automatically filter input string to escape any HTML content, but this option is off by default.

Yes
High
PY

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
Ruby

Possible command injection via exec()-type functions

Ruby has many ways to do system calls, including syscall, system, exec, but also %x() and the use of backticks. Backticks (``) in Ruby are very dangerous and counter-intuitive. These are not single quotes ('). Ruby automatically attempts to execute the contents of the backticks as a shell command and the output will be returned.

Yes
High
YAML

Use of vulnerable ingress-nginx controller

Using a ingress-nginx controller below version v1.11.2 is vulnerable to CVE-2024-7646. It allows an attacker with permission to create Ingress objects, to obtain the credentials of the ingress-nginx controller (via arbitrary command injection).

No
High
kotlin

Accessing Android external storage can expose files

Files created on the external storage are globally readable and writable. Therefore, a malicious application having write or read permissions could try to access sensitive information from the files that other applications have stored on the external storage.

No
High
kotlin

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
dart

Accessing Android external storage can expose files

Files created on the external storage are globally readable and writable. Therefore, a malicious application having write or read permissions could try to access sensitive information from the files that other applications have stored on the external storage.

No
High
dart

Potential SQL injection using sqflite execute sink

SQL injection might be possible in these locations (using sqflite database), especially if the strings being concatenated are controlled via user input.

No
High
dart

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
GO

Predictable temp file creation could lead to data exposure

Creating temp files based on user input or with a predictable pattern can lead to malicious users being able to hijack temporary files or folder more easily, leading to data disclosure or attackers being able to inject files more easily.

No
High
GO

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

Yes
High
Clojure

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
JS

Path traversal attack possible via Express.js sendFile()

A malicious actor could control the location of this file, which may allow them to retrieve files outside of the intended folder.

Yes
High
Swift

Potential SQL injection via dynamic raw query construction

SQL injection vulnerabilities might occur in these areas, especially when user input taints concatenated strings or the raw query.

No
High
rust

Potential SQL injection via dynamic raw query construction

SQL injection vulnerabilities might occur in these areas, especially when user input taints concatenated strings or the raw query.

No
High
c

Potential SQL injection via dynamic raw query construction

SQL injection vulnerabilities might occur in these areas, especially when user input taints concatenated strings or the raw query.

No
High
rust

Path traversal attack possible

The application constructs file paths using untrusted data, potentially leading to a path traversal vulnerability. An attacker could manipulate these inputs to access, create, or overwrite sensitive files.

Yes
High
Clojure

Path traversal attack possible

The application constructs file paths using untrusted data, potentially leading to a path traversal vulnerability. An attacker could manipulate these inputs to access, create, or overwrite sensitive files.

Yes
High
Ruby

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Ruby

Path traversal attack possible

A malicious actor could control the location of this file, which may allow them to retrieve, write or delete files outside of the intended folder.

Yes
High
APEX

Potential SQL injection via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Elixir

Path traversal attack possible

A malicious actor could control the location of this file, which may allow them to retrieve, write or delete files outside of the intended folder.

No
High
VB

Rendering unescaped input can lead to XSS attacks

Outputting user input risks cross-site scripting vulnerability. This could in turn be used to facilitate account takeover attacks.

No
High
Ruby

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g. evilsite.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

Yes
High
Ruby

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g. evilsite.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

No
High
Ruby

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g. evilsite.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

No
High
Swift

NSPredicate can be abused to eval() injected code

Predicates play a crucial role in representing logical conditions that assess whether an object meets specific criteria. However, when NSPredicates are built using user-provided data without proper sanitization, attackers can exploit this vulnerability to manipulate the intended logic of the predicate.

No
High
Scala

Potential Zip Slip via Unsanitized Archive Extraction

An application that accepts a user-supplied archive and extracts its contents without validating entry paths is vulnerable to Zip Slip. An attacker can craft an archive containing entries with path traversal sequences such as ../../etc/cron.d/evil, causing extraction to write files outside the intended destination directory.

No
High
PHP

Laravel cookies can be sent unencrypted

Found a configuration file where the secure attribute is not set to 'true'. Setting 'secure' to 'true' prevents the client from transmitting the cookie over unencrypted channels and therefore prevents cookies from being stolen through man-in-the-middle attacks.

Yes
High
PHP

SSL certificate verification turned off during requests

We found an instance where PHP's Curl is doing an external request with CURLOPT_SSL_VERIFYPEER = false. That means PHP will not verify the SSL certificate of the external website and might become vulnerable to man-in-the-middle attacks.

Yes
High
PHP

Using extract() can lead to unexpected behavior

Using extract with user input can cause confusing behavior of your code, because it can overwrite variables that you usually wouldn't expect to be overwritten.

No
High
PY

Rendering unescaped input can lead to XSS attacks

User input is rendered unsafely in Django via HttpResponse(...). As the input does not appear to be escaped, this could lead to a cross-site scripting attack.

No
High
JS

Using dangerouslySetInnerHTML in React can lead to XSS attacks

Using dangerouslySetInnerHTML can allow attacks to insert HTML into your page, or even scripts if you don't have strict CSP rules set up. Worst case, it could be used as a way to start a social engineering attack or start an account takeover attack.

Yes
High
PHP

Potential SQL injection when bypassing Doctrine ORM with raw query

You're using a Doctrine method to execute a SQL query, but the query being passed is not a constant string. This could lead to SQL injection if the variable is user-controlled and not properly sanitized.

No
High
PHP

Using potentially unsafe FTP connections to move data

You're using the PHP FTP API, which is poorly documented and has poor support for encryption.

No
High
.NET

Object deserialization can lead to remote code execution

Deserializing objects is dangerous because attackers can create malicious object files with unintended consequences. The current configuration of NewtonSoft allows to deserialize the JSON to any object, which could potentially allow remote code execution.

No
High
C

Double free may lead to undefined behavior

The software calls free() twice on the same memory address, potentially leading to memory corruption. This corruption can cause the program to crash or cause two later calls to malloc() to return the same pointer.

No
High
JS

Using v-html in Vue templates can lead to XSS attacks

Using v-html can allow attacks to insert HTML into your page, or even scripts if you don't have strict CSP rules set up. Worst case, it could be used as a way to start a social engineering attack or start an account takeover attack.

Yes
High
JS

Rendering unescaped input in EJS template can lead to XSS attacks

Using <%- %> renders an unescaped string into the template. This means the developer is responsible for allowlisting all HTML strings that can be passed in.

No
High
JS

Rendering unescaped input in handlebar/mustache template can lead to XSS attacks

Using {{{ }}} renders an unescaped string into the template. This means the developer is responsible for allowlisting all HTML strings that can be passed in.

No
High
JS

Rendering unescaped input in HTML template can lead to XSS attacks

Using {{ .foo | safeHTML }} (or {{ .foo | safe }} in Jinja2) renders an unescaped string into the template. This means the developer is responsible for allowlisting all HTML strings that can be passed in.

No
High
kotlin

Delivering code in production with debug features activated is security-sensitive

Development tools and frameworks usually have options to make debugging easier for developers. Although these features are useful during development, they should never be enabled for applications deployed in production. Debug instructions or error messages can leak detailed information about the system, like the application’s path or file names.

No
High
dart

Delivering code in production with debug features activated is security-sensitive

Development tools and frameworks usually have options to make debugging easier for developers. Although these features are useful during development, they should never be enabled for applications deployed in production. Debug instructions or error messages can leak detailed information about the system, like the application’s path or file names.

No
High
JS

Using document write methods can lead to XSS attacks

User controlled data in methods like 'innerHTML', 'outerHTML' or 'document.write' is an anti-pattern that can lead to XSS vulnerabilities.

No
High
HTML

Using document write methods can lead to XSS attacks

User controlled data in methods like 'innerHTML', 'outerHTML' or 'document.write' is an anti-pattern that can lead to XSS vulnerabilities.

No
High
yaml

Template Injection in GitHub Workflows Action

A GitHub Actions workflow step contains a template expression referencing potentially untrusted GitHub context fields. This may allow malicious input to be injected into shell commands, leading to a potential supply chain attack as tokens of the CI/CD pipeline could be exfiltrated.

Yes
High
yaml

Template Injection in Azure Pipelines

An Azure Pipelines YAML step contains a compile-time template expression (${{ }}) referencing potentially untrusted sources such as parameters, variables, or pipeline resource metadata. Because these expressions are expanded before the shell executes, malicious input can be injected directly into inline script bodies, potentially allowing exfiltration of pipeline secrets or service connection tokens.

No
High
JS

Server-Side Template Injection via untrusted input in `express.render()`

Direct use of user-controlled inputs as arguments to the `express.render()` function can result in server-side template injection when the template engine evaluates untrusted data. An attacker may craft malicious payloads to read local files or, depending on the template engine and its configuration, escalate the issue to remote code execution by abusing template logic and expression handling.

No
High
PHP

Potential SQL injection in Doctrine's QueryBuilder

Passing user input directly to Doctrine's QueryBuilder without query parametrization (e.g. via Doctrine's `setParameter(...)`) may allow SQL injection.

No
High
C

Insecure use of the strcpy function

Strcpy does not check the size of the destination buffer. As a result, copying data larger than the buffer can cause a buffer overflow, potentially leading to crashes, data corruption, or arbitrary code execution by an attacker.

No
High
C

Insecure use of the strcpy function

Strcpy does not check the size of the destination buffer. As a result, copying data larger than the buffer can cause a buffer overflow, potentially leading to crashes, data corruption, or arbitrary code execution by an attacker.

No
High
JS

Unsanitized user input in jQuery DOM handling methods detected

User controlled data in jQuery DOM manipulation methods like 'html()', 'replaceWith()' or 'wrap()' is an anti-pattern that can lead to XSS vulnerabilities.

No
High
yaml

Prompt Injection in GitHub Workflows Action

A GitHub Actions workflow contains a AI inference prompt, referencing potentially untrusted GitHub context fields. This may allow malicious input to be injected into the prompt, which makes the output of the prompt highly insecure. If the output is used to execute a command, they could potentially exfiltrate data from the pipeline (e.g. highly privileged secrets).

No
High
PHP

Potential SQL injection via Laravel function

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input. We look for raw SQL functions being used, such as whereRaw, DB::raw,... but also the usage of dynamic expressions for column names that are tainted by user input.

Yes
High
PHP

Potential SQL injection via Drupal database functionality

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input. We look for raw SQL functions being used, such as Database::getConnection()->query(''),... in combination with user input.

Yes
High
PHP

Potential NoSQL injection via string-based query concatenation

NoSQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
Java

Potential NoSQL injection via string-based query concatenation

NoSQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
PYTHON

Insecure Deserialization in torch.load() leading to remote code execution

Using torch.load() with weights_only=False deserializes data via Python’s pickle mechanism, which allows arbitrary code execution if a malicious .pt file is loaded from an untrusted source.

No
High
VB

Potential NoSQL injection via string-based query concatenation

NoSQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
.NET

Potential NoSQL injection via string-based query concatenation

NoSQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
TS

Enabling NodeJS in Electron can lead to remote code execution

NodeJS integration exposes Node APIs to the electron app and this can introduce remote code execution vulnerabilities to the application if the app is vulnerable to Cross Site Scripting (XSS).

No
High
C

Insecure password hashing algorithm

The crypt functions are not recommended due to the significantly small key space. Modern hardware can crack crypt produced passwords relatively quickly.

No
High
PY

SSL certificate verification turned off during requests

We found an instance where Python's requests library is doing an external request with verify=False. That means Python will not verify the SSL certificate of the external website and might become vulnerable to man-in-the-middle attacks.

Yes
High
JS

Potential Cross Site Scripting (XSS) via window.location.href

Using window.location.href or similar redirection methods with unvalidated user input can lead to cross-site scripting (XSS). If an attacker controls part of the URL, they may inject malicious scripts that execute in the victim’s browser, potentially allowing session hijacking, data theft, or other unauthorized actions. Proper validation and encoding of user-controlled values are required before using them in redirects or client-side navigation.

No
High
JS

Potential SQL injection in sqlite3 via string-based query concatenation

SQL injection might be possible in these locations, especially if the strings being concatenated are controlled via user input.

No
High
JS

Enabling NodeJS in Electron can lead to remote code execution

NodeJS integration exposes Node APIs to the electron app and this can introduce remote code execution vulnerabilities to the application if the app is vulnerable to Cross Site Scripting (XSS).

No
High
Ruby

User input could manipulate forbidden fields of object due to mass assignment

An object is created using permit!, which overrides the default mass assignment protection and potentially allows an user to change fields they shouldn't be allowed to change.

No
High
kotlin

Enabling file access for WebViews is risky

If malicious JavaScript code in a WebView is executed this can leak the contents of sensitive files when access to local files is enabled.

No
High
GO

App ignores host keys in SSH connections

The app was found to ignore host keys during SSH connection. Host keys are important as they provide assurance that the client can prove that the host is trusted. By ignoring these host keys, it is impossible for the client to validate the connection is to a trusted host.

No
High
GO

Possible command injection via shell script

Your code spawns a subprocess via a shell script. User input could be abused to inject extra commands.

Yes
High
JS

Prototype pollution vulnerability detected

A prototype pollution vulnerability was detected, which allows an attacker to change an object's prototype, enabling them to inject and modify properties of objects within the application, which may change application behavior and lead to data leaks or authorization bypasses, or cross-site scripting (XSS) if the vulnerability is in a front-end application.

Yes
High
Rust

NoSQL injection attack possible

Query injection attacks are possible if users can pass objects instead of strings or unsanitized NoSQL commands to query functions such as find_one. By injecting query operators attackers can control the behavior of the query, allowing them to bypass access controls and extract unauthorized data. Consider the attack payload `?user_id[$ne]=5`: if the user_id query parameter is passed to the query function without validation or casting its type, an attacker can pass {$ne: 5} instead of an integer to the query. {$ne: 5} uses the 'not equal to' operator to access data of other users. While this vulnerability is known as NoSQL injection, relational databases (mysql, postgres) are also vulnerable to this attack if the query library offers a NoSQL-like API and supports string-typed query operators.

No
High
rust

Open redirect can be used in social engineering attacks

An open redirect allows an attacker to use your app to perform social engineering attacks by redirecting users to other top-level domains (e.g malicious.example.com). It can usually also be used to combine with other exploits that could result in stolen credentials and user account takeover.

No
High
java

SpEL injection possible via unsafe Expression evaluation

Spring Expression Language (SpEL) allows for dynamic evaluation of expressions. If untrusted user input is passed directly to the SpEL expression parser without validation or sanitization, an attacker can manipulate the expression to execute arbitrary Java code, leading to Remote Code Execution (RCE).

No
High
Java

Unsafe exec usage can lead to remote code execution

Using exec with expressions based on user input can execute arbitrary code.

No
High
Java

HttpServletResponse output can be used for XSS attacks

Cross-site scripting detected in HttpServletResponse writer. User input was detected going directly from the HttpServletRequest into output.

Yes
High
.NET

Unsafe XSLT setting can lead to RCE

By setting `XsltSettings.EnableScript` to true, an adversary who is able to influence the loaded XSL document could directly inject code to compromise the system. It is strongly recommended that an alternative approach is used to work with XML data.

No
High
.NET

Input validation disabled in controller

By using the `[ValidateInput(false)]` attribute in a controller class, the application will disable request validation for that method. This disables ASP.NET from examining requests for injection attacks such as Cross-Site-Scripting (XSS).

Yes
High
TS

Potential file inclusion attack via reading file

If an attacker can control the input leading into the ReadFile function, they might be able to read sensitive files and launch further attacks with that information.

Yes
High
TS

A timing attack might allow hackers to bruteforce passwords

An insecure way to compare passwords to user input might allow hackers to bruteforce passwords.

Yes
High
Java

Cookie missing HttpOnly flag

A cookie has been set without the HttpOnly flag, which means that the cookie can be accessed by JavaScript. If a malicious script can be run on this page then the cookie will be accessible from JavaScript and can be exfiltrated to another site. If this is a session cookie then account takeovers may be possible.

No
High
Java

App uses an outdated TLS protocol

The application was found enabling insecure TLS protocol versions (1.0 or 1.1). When enabling protocol versions for an `SSLContext`, only the following versions should be allowed: TLSv1.2, TLSv1.3, DTLSv1.2, DTLSv1.3

Yes
High
JS

Potential file inclusion attack via reading file

If an attacker can control the input leading into the ReadFile function, they might be able to read sensitive files and launch further attacks with that information.

Yes
High
kotlin

Android KeyStore should only allow access to authenticated users

Android KeyStore is a secure container for storing key materials, in particular it prevents key materials extraction, i.e. when the application process is compromised, the attacker cannot extract keys. It’s possible to enable an Android security feature to restrict usage of keys to only authenticated users. The lock screen has to be unlocked with defined credentials (pattern/PIN/password, biometric).

No
High
yaml

3rd party Github Actions should be pinned

A third-party GitHub Action was imported, and is not pinned via a hash. This leaves your CI/CD at risk for potential supply chain attacks, if the affected GitHub Action is compromised.

Yes
High
GO

Simple DOS attack possible due to http.server misconfiguration

A specific type of Denial-of-service (DOS) attack is possible called a Slowloris attack. It relies on partial http request to work.

Yes
High
GO

Potential file inclusion attack via reading file

If an attacker can control the input leading into the ReadFile function, they might be able to read sensitive files and launch further attacks with that information.

Yes
High
yaml

Using unsafe GitHub Actions trigger may allow privilege escalation via CI/CD

Using pull_request_target or workflow_run as a trigger is not recommended, as it may allow an attacker to elevate its privileges via the CI/CD pipeline by exfiltrating secrets (e.g. by reading out the caches of the GitHub Actions pipeline or listing loaded secrets in the environment). If the affected repository is open source, the attacker doesn't have to be an insider but could be any GitHub user.

Yes
High
rust

Potential command injection via Command API

While Rust's Command API follows security best practices by avoiding direct shell evaluation, improper handling of user inputs can still introduce command injection risks. If unsanitized user-controlled data is passed to `Command::arg()` or similar functions, an attacker may manipulate arguments to execute unintended commands, potentially leading to privilege escalation or system compromise

No
High
Java

Spring Boot Actuator endpoints are publicly exposed

The use of permitAll() for the `/acutator` path exposes sensitive Spring Boot Actuator endpoints to the public. This could allow attackers to retrieve sensitive information from the server, such as the heapdump of the application (which may contain environment secrets). This could be leveraged to further escalate into your infrastructure.

No
High
Kotlin

XML-based XXE attack possible

External XML entities are a feature of XML parsers that allow documents to contain references to other documents or data. This feature can be abused to read files, communicate with external hosts, exfiltrate data, or cause a Denial of Service (DoS).

No
High
JS

Path traversal attack possible

Potential user input appears to reach Supabase Storage operations. If this input is not validated, and the Supabase Storage operations are executed using a service role, an attacker could potentially write to or download files from other folders. This occurs because Supabase's SDK resolves the path internally.

Yes
High
Clojure

App uses an outdated TLS protocol

The application was found enabling insecure TLS protocol versions (1.0 or 1.1). When enabling protocol versions for an `SSLContext`, only the following versions should be allowed: TLSv1.2, TLSv1.3

Yes
High
java

XXE attack possible via unsafe DocumentBuilder configuration

External XML entities are a feature of XML parsers that allow documents to contain references to other documents or data. This feature can be abused to read files, communicate with external hosts, exfiltrate data, or cause a Denial of Service (DoS).

No
High
yaml

Overly Broad Permissions in GitHub Actions Workflows is risky

Workflows often grant excessive permissions at the workflow level, unintentionally giving all jobs unnecessary access. It raises the risk of privilege abuse or unintended actions within the pipeline.

Yes
Medium
.NET

Xpath injection attack could lead to information extraction

XPath injection is a vulnerability that can allow an adversary to inject or modify how an XML query is structured. Depending on the logic of the original query, this could lead to adversaries extracting unauthorized information or in rare cases bypassing authorization checks.

Yes
Medium
JAVA

Xpath injection attack could lead to information extraction

XPath injection is a vulnerability that can allow an adversary to inject or modify how an XML query is structured. Depending on the logic of the original query, this could lead to adversaries extracting unauthorized information or in rare cases bypassing authorization checks.

No
Medium
.NET

Use of broken or outdated encryption

Cryptographic algorithms provide many different modes of operation, only some of which provide message integrity. Without message integrity it could be possible for an adversary to attempt to tamper with the ciphertext which could lead to compromising the encryption key. Newer algorithms apply message integrity to validate ciphertext has not been tampered with.

No
Medium
PY

Use of known insecure function to create temp files

You're using a deprecated Python API tempfile.mktemp that does not guarantee atomicity during the creation and opening of this file. This can lead to unintended access of the file by different processes.

Yes
Medium
PY

Using potentially unsafe FTP connections to move data

You're using the Python FTP API, which has poor support for encryption.

No
Medium
Swift

Usage of deprecated or broken encryption detected

Weak encryption, predictable cipher outputs, and flawed hashing could potentially affect the integrity of the encrypted data.

No
Medium
python

Unsafe TAR file extraction detected

Unsafe usage of tarfile.extract() or tarfile.extractall() in Python can allow path traversal, symlink attacks, or permission issues when extracting untrusted tar files.

No
Medium
JS

DOM Cross-Site Scripting (XSS) via Insecure jQuery Execution Sinks

The application passes untrusted, unsanitized data into a jQuery execution sink (such as the `$()` constructor, `.append()`, `.html()`, or sensitive attributes like `href`). If the data contains malicious HTML or JavaScript, jQuery's internal engine will evaluate and execute it, leading to DOM-based Cross-Site Scripting (XSS).

No
Medium
VB

Use of broken or outdated encryption

Cryptographic algorithms provide many different modes of operation, only some of which provide message integrity. Without message integrity it could be possible for an adversary to attempt to tamper with the ciphertext which could lead to compromising the encryption key. Newer algorithms apply message integrity to validate ciphertext has not been tampered with.

No
Medium
Java

Stacktrace might be exposed to end user

Handling exceptions only with a printStackTrace() might result in stacktraces and variables being exposed in log files. Moreover, the developers who might need these stacktraces to detect the problems might never find them in those logs.

Yes
Medium
Scala

Stacktrace might be exposed to end user

Handling exceptions only with a printStackTrace() might result in stacktraces and variables being exposed in log files. Moreover, the developers who might need these stacktraces to detect the problems might never find them in those logs.

No
Medium
Scala

Stacktrace might be exposed to end user

Handling exceptions only with a printStackTrace() might result in stacktraces and variables being exposed in log files. Moreover, the developers who might need these stacktraces to detect the problems might never find them in those logs.

No
Medium
.NET

Authorization bypass possible in controller

The endpoint is potentially accessible to unauthorized users. If it contains sensitive information, like log files for example, it may lead to privilege escalation.

Yes
Medium
.NET

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

No
Medium
JS

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this http request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous is the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud.

Yes
Medium
Java

App does not validate SSL certificates properly

The `org.apache.http.impl.client.DefaultHttpClient` and `javax.net.ssl.SSLContext.getInstance` object instances do not verify the hostnames upon connection. This allows for an adversary who is in between the application and the target host to intercept potentially sensitive information or transmit malicious data.

No
Medium
Java

Insecure URL used to load 3rd party dependencies

Avoid using http urls as they are not encrypted and can be intercepted by an attacker.

No
Medium
py

Potential SQL injection when bypassing Django ORM with extra()

This is an older API, use it only as a last resort. Using this API puts the developer in charge of escaping user input so that it cannot lead to SQL injection flaws.

No
Medium
PY

Potential SQL injection when bypassing Django ORM with RawSQL()

Use it only as a last resort. Using this API puts the developer in charge of escaping user input so that it cannot lead to SQL injection flaws.

No
Medium
PY

Potential user input in HTTP request may allow SSRF attack

If an attacker can control the URL input leading into this HTTP request, the attack might be able to perform an SSRF attack. This kind of attack is even more dangerous if the application returns the response of the request to the user. It could allow them to retrieve information from higher privileged services within the network (such as the metadata service, which is commonly available in cloud services, and could allow them to retrieve credentials).

Yes
Medium
dockerfile

Binary, code or archive is pulled from a remote source without integrity verification

A Docker container was built using an artifact from a remote source without any integrity verification. If the remote artifact were silently replaced with a malicious version (for example, through a supply chain attack), the integrity and confidentiality of the environment in which the container is deployed could be compromised.

Yes
Medium
yaml

Binary, code or archive is pulled from a remote source without integrity verification

A GitHub Actions Workflow was built using an artifact from a remote source without any integrity verification. If the remote artifact were silently replaced with a malicious version (for example, through a supply chain attack), the integrity and confidentiality of the environment in which the container is deployed could be compromised.

No
Medium
Ruby

Using document write methods can lead to XSS attacks

User controlled data in methods like 'innerHTML', 'outerHTML' or 'document.write' is an anti-pattern that can lead to XSS vulnerabilities.

No
Medium
Elixir

Using raw on potential user input can leads to XSS

Rendering content with `raw` bypasses HTML escaping, which can lead to Cross-Site Scripting (XSS) if any untrusted data is included.

No
Medium
Elixir

Using String Interpolation in Ecto.query can lead to SQLi

Avoid direct string interpolation in SQL queries with Ecto, especially for user-controlled inputs

No
Medium
rust

Unsafe C function usage in Rust detected

When Rust code calls unsafe C or C++ functions like strlen, sprintf, fgets, strcmp, strcpy, malloc, and others, it bypasses Rust's memory safety guarantees, exposing the application to risks such as buffer overflows, null pointer dereferencing, and use-after-free. An attacker can exploit these vulnerabilities by crafting malicious input that triggers memory corruption, potentially leading to arbitrary code execution, data leakage, or application crashes.

No
Medium
APEX

Apex Visualforce misconfigurations may lead to Cross-Site Scripting (XSS) Vulnerabilities

Apex pages are vulnerable to XSS when developers directly include unvalidated custom scripts or disable the built-in output escaping on Visualforce tags. It allows attackers to inject and execute malicious scripts in the victim's browser context.

No
Medium
.NET

Potential XSS via MarkupStr(...) in Razor template may lead to XSS

Using MarkupStr can allow attacks to insert HTML into your page, or even scripts if you don't have strict CSP rules set up. Worst case, it could be used as a way to start a social engineering attack or start an account takeover attack.

No
Medium
VB

Authorization bypass possible in controller

The endpoint is potentially accessible to unauthorized users. If it contains sensitive information, like log files for example, it may lead to privilege escalation.

No
Medium
VB

HTTP request might enable SSRF attack

If an attacker can control the URL input leading into this HTTP request, they might be able to perform an SSRF attack. This kind of attack is even more dangerous if the application returns the result of the URL fetch to the user. It can serve as an initial access point for an attacker for stealing credentials in the cloud or pivoting into the internal network.

No
Medium
kotlin

Biometric login should be verified using encryption

Extra encryption prevents an attacker with physical access to the device would try to hook into the application process and call the onAuthenticationSucceeded method directly.

No
Medium
JS

XML based XXE attack possible

Detected use of parseXml() function with the `noent` field set to `true`. Parsing of external entities (disabled by default) can lead to an XML External Entities (XXE) attack if untrusted data is passed into it.

Yes
Medium
Elixir

Potential SQL injection possible via Ecto.query fragments

A potential SQL injection attack was discovered, due to string interpolation with Ecto's SQL fragments. If the affected input originates from a user-controlled value, an attacker may be able to exfiltrate or affect the integrity of your data.

No
Medium
python

3rd party Langchain imports should be pinned

A langchain prompt was imported, and is not pinned via a hash. This leaves your code at risk for potential supply chain attacks, if the affected langchain prompt is compromised.

No
Medium
Elixir

Potential Atom Exhaustion possible via String to Atom

A potential Atom Exhaustion vulnerability was identified due to insecure usage of the String.to_atom/1 function. Avoid converting user-controlled inputs to atoms using String.to_atom/1, as this can lead to a denial-of-service attack.

No
Medium
Elixir

Potential Atom Exhaustion possible via List to Atom

A potential Atom Exhaustion attack was discovered, due to insecure usage of `list_to_atom` method. If the affected input originates from a user-controlled value, an attacker may be able to generate a Denial of Service.

No
Medium
Java

Unsafe generation of Initialization Vector (IV) using static or predictable values detected

Using a static, predictable Initialization Vector (IV) for encryption compromises confidentiality. Identical plaintexts will produce identical ciphertexts, allowing attackers to detect patterns and relationships in the data. This vulnerability enables deterministic decryption and exposes the system to known-plaintext attacks.

No
Medium
VB

Input validation disabled in controller

By using the `<ValidateInput(false)>` attribute in a controller class, the application will disable request validation for that method. This disables ASP.NET from examining requests for injection attacks such as Cross-Site-Scripting (XSS).

No
Medium
PY

Potential file inclusion attack via reading file

If an attacker can control the input leading into the open function, they might be able to read sensitive files and launch further attacks with that information.

Yes
Medium
C

Insecure string processing function strcat

The `strcat` and family of functions do not guarantee the final string to be null terminated.

No
Medium
C

Use of deprecated function (mktemp)

The `mktemp` function should no longer be used due to multiple flaws. Some implementations created random files by using known information like the process ID and a single letter.

No
Medium
C

Use of Inherently Dangerous Function

The gets() function is unsafe because it does not perform bounds checking on the size of its input. An attacker can easily send arbitrarily-sized input to gets() and overflow the destination buffer.

No
Medium
Java

Avoid usage of deprecated 3rd party repositories

Relying on deprecated repositories like Bintray can cause issues, such as artifacts being resolved from different servers or CI build failures.

No
Medium
JS

Improper sanitization in dynamic attribute bindings can lead to XSS attacks

This vulnerability arises when user-controlled input is directly bound to dynamic attributes such as :href without proper sanitization. An attacker can inject malicious payloads (e.g., javascript: URLs or crafted CSS) that execute in the victim’s browser context. Exploitation may result in cross-site scripting (XSS), data exfiltration, or unauthorized actions on behalf of the user.

No
Medium
Java

Unsanitized user input leads to cross-site scripting (XSS)

There's potentially unsanitized user input which seems to flow into HTTP response output sinks, which could lead to a cross-site scripting attack (XSS).

No
Medium
Ruby

Mass assignment protection is disabled

The default mass assignment protection configuration is overridden and set to 'True', which is discouraged as it may introduce mass assignment vulnerabilities.

No
Medium
PY

Possible command injection via shell script

Your code spawns a subprocess via a shell script. User input could be abused to inject extra commands.

Yes
Medium
kotlin

Allowing universal access to any origin from files is risky

When allowing universal access to any origin from the file:/// scheme in a webview, you may allow an attacker to access cross-origin data (from other sites) when exploiting a cross-site scripting attack (e.g. via its DOM) in a local file.

No
Medium
Elixir

Potential SQL `LIKE`-injection

A potential SQL LIKE-injection attack was discovered, due to handling `like` or `ilike` clauses without sanitization. If the input originates from a user-controlled value, an attacker may be able to take advantage from uncontrolled wildcard usage to broaden the query scope, causing unintended results or potential Denial of Service (DoS)

No
Medium
Swift

Potential JavaScript Code Injection

Evaluating JavaScript that contains a substring from a remote origin may lead to remote code execution. Code written by an attacker can execute unauthorized actions, including exfiltration of local data through a third party web service.

No
Medium
JS

Potential XSS due to enabling bypassSecurityTrustUrl

The risks of using Angular's `bypassSecurityTrustUrl` function arise when untrusted user input is passed to it, allowing attackers to inject malicious URLs and create cross-site scripting (XSS) vulnerabilities. This function bypasses Angular's DomSanitizer security mechanisms, marking any URL as trusted. Attackers can exploit this by using malicious URLs in user input, potentially executing arbitrary JavaScript, stealing session cookies, or performing unauthorized actions on behalf of users.

No
Medium
js

Exposing process.env via Vite config

Using Vite’s define option to expose process.env directly can unintentionally embed server-side environment variables into client-side bundles. During build time, Vite statically replaces define values in the generated code. If process.env is passed to define, all referenced variables — including secrets such as API keys, tokens, or internal configuration — become part of the compiled frontend assets. These values are then accessible to anyone inspecting the browser bundle, source maps, or network responses.

No
Medium
Go

Directly writing unsanitized input to http.ResponseWriter can lead to XSS

Writing user-controlled input directly to http.ResponseWriter without proper encoding or sanitization introduces a cross-site scripting (XSS) vulnerability. This allows attackers to inject malicious scripts into pages viewed by other users.

No
Medium
Java

Use of broken or outdated encryption

Cryptographic algorithms provide many different modes of operation, only some of which provide message integrity. Without message integrity it could be possible for an adversary to attempt to tamper with the ciphertext which could lead to compromising the encryption key. Newer algorithms apply message integrity to validate ciphertext has not been tampered with.

No
Medium
yaml

Replace direct NPM publishing with staged publishing

Ensure workflows utilize NPM staged publishing. Standard direct publishing immediately deploys packages if a pipeline is compromised, whereas staged publishing adds an extra approval step before the package is live on the registry. This improves your supply chain security posture, and limits the attack surface of your supply chain and its related deployment strategies.

Yes
Medium
Java

CSRF protection disabled on purpose

CSRF was disabled in this class on purpose. Verify that this is acceptable.

Yes
Medium
rust

Improper memory size operations inside Rust unsafe detected.

Rust's safety guarantees can be bypassed using unsafe operations like `MaybeUninit::uninit().assume_init()` and `mem::transmute_copy`, leading to undefined behavior if misused. Attackers can exploit unsafe Rust memory operations to trigger crashes, information leaks, or data corruption.

No
Medium
Java

JSP Scriptlets are used and are hard to keep secure

Scriptlets are difficult to use securely and are considered bad practice.

No
Medium
PHP

Path traversal attack possible via file functions

A malicious actor could control the location of this file, to include going backwards up a directory by adding '../' to the input.

Yes
Medium
C

Possible integer overflow or underflow

The `atoi` family of functions can potentially overflow or underflow integer values.

Yes
Medium
C

Usage of insufficient random number generators

The detected function is not sufficient at generating security-related random numbers, such as those used in key and nonce creation.

No
Medium
C

Usage of deprecated function getlogin()

The `getlogin` function suffers from many bugs or unknown behaviors depending on the system. Often, it gives only the first 8 characters of the login name.

No
Medium
C

Use of Externally-Controlled Format String

Avoid using user-controlled format strings passed into `sprintf`, `printf` and `vsprintf`. These functions put you at risk of buffer overflow vulnerabilities through the use of format string exploits.

No
Medium
rust

Insecure file permissions detected

Improperly setting file permissions can expose sensitive data, allow unauthorized modifications, or enable execution of malicious code. This often occurs in shared directories, leading to privilege escalation or data breaches.

Yes
Medium
rust

Rust safety bypass can lead to security risks in unsafe operations

This code did not enforce Rust safety bounds checking, ownership validation, or type safety guarantees in when handling critical operations within an unsafe block. Attackers may exploit this weakness to execute arbitrary code, trigger denial-of-service via panics, or manipulate memory out of bounds, such as read/write violations, by abusing unchecked arithmetic, transmutation, or direct pointer assignments.

No
Medium
Swift

Insecure TLS configuration detected

TLS (Transport Layer Security) is a protocol that secures Internet communications, preventing eavesdropping, tampering, and message forgery. Older versions are unsafe due to vulnerabilities that could lead to potential leakages and man-in-the-middle attacks.

No
Low
kotlin

Enabling JavaScript in WebViews is risky

JavaScript code can exfiltrate information from your Android app or result in code injection.

Yes
Low
dart

Enabling JavaScript in WebViews is risky

JavaScript code can exfiltrate information from your Android app or result in code injection.

No
Low
Swift

Enabling JavaScript in WebViews is risky

Enabling JavaScript rendering in WebKit can potentially create serious security risks, including vulnerabilities like Cross-site Scripting (XSS) and Clickjacking.

Yes
Low
rust

Accepting invalid TLS information can be risky

This vulnerability in Rust happens when TLS clients fail to properly validate certificates. As a result, unauthorized connections can occur even when the certificate or the hostnames are invalid. It can lead to man-in-the-middle attacks, where an attacker intercepts encrypted communications by presenting a fraudulent certificate that bypasses validation.

Yes
Low
Scala

Missing Authorization on JAX-RS endpoints

Endpoints with no `@RolesAllowed` or `@DenyAll` — at either method or class level — are open to any unauthenticated caller. This is silently worsened if RolesAllowedDynamicFeature is absent from ResourceConfig, rendering all existing annotations inert with no runtime warning.

No
Low
C

Random file descriptor exhaustion

Call to `read()` without error checking is susceptible to file descriptor exhaustion.

No
Low
kotlin

Receiving intents without permissions is risky

Other applications can send potentially malicious broadcasts, so it is important to consider broadcasts as untrusted and to limit the applications that can send broadcasts to the receiver.

No
Low
Swift

Forbidden API `ptrace` usage detected

The use of ptrace API is forbidden for iOS App Store applications. Developers should avoid invoking such APIs. This may lead to rejection during the App Store review process since ptrace is not in the iOS SDK.

No
Low
Swift

WKWebView should not be allowed to open windows via Javascript

WKWebView preferences to allow JavaScript to automatically open windows can lead to exploitation if malicious scripts are executed. This practice violates the principle of least privilege and increases the application's attack surface.

Yes
Low
rust

Improper unsafe usage in safe functions may lead to unsoundness issues.

If unsafe blocks are used carelessly in safe functions (fn), attackers could exploit undefined behavior (e.g., via dangling pointers or unaligned reads) to leak data, crash the program, or achieve arbitrary code execution.

No
Low
python

Insecure usage of `requests` sends data over cleartext

HTTP Requests made with `requests` library were discovered to lack TLS encryption, exposing sensitive data to interception and tampering.

No
Low
Ruby

Disabling JSON HTML Escaping in ActiveSupport may lead to XSS

When `ActiveSupport.escape_html_entities_in_json` is set to false, JSON-encoded responses may contain unescaped HTML entities. This can lead to XSS attacks if the JSON is rendered in a browser without proper sanitization. An attacker could inject malicious JavaScript via user-controlled input that gets embedded in JSON responses. If the response is rendered directly in a browser, the script executes in the victim's context, enabling XSS.

No
Low
Dotnet

Insecure Cookie configuration detected

The application configures cookies with insecure `CookieOptions` (such as`Secure=false`, `HttpOnly=false`, `SameSite=None`) or excessive persistence (e.g. `MaxAge` and `Expires` set beyond one year), exposing session data to client-side scripts, transmission over unencrypted channels, and cross-site request contexts, which increases the risk of session hijacking and unauthorized access. This configuration weakens session confidentiality and integrity by allowing cookies to be intercepted, accessed via XSS, or reused for extended periods if compromised.

No
Low
VB

Insecure Cookie configuration detected

The application configures cookies with insecure `CookieOptions` (such as `Secure=False`, `HttpOnly=False`, `SameSite=None`) or excessive persistence (e.g. `MaxAge` and `Expires` set beyond one year), exposing session data to client-side scripts, transmission over unencrypted channels, and cross-site request contexts, which increases the risk of session hijacking and unauthorized access. This configuration weakens session confidentiality and integrity by allowing cookies to be intercepted, accessed via XSS, or reused for extended periods if compromised.

No
Low
dart

Use of JavaScript channels may be unsafe

The use of JavaScript channels may be unsafe if you load arbitrary websites into your webview. Even if you are loading web page you control, any embedded content (e.g. iframes) of 3rd parties are able to communicate with the JavaScript channel as well.

No
Low
dart

Enabling file access for WebViews is risky

WebViewController.loadFile() sets setAllowFileAccess to true by default for the webview, even if the webview loads another origin later on. If malicious JavaScript code in a WebView is executed this can leak the contents of sensitive files.

No
Low
rust

The output of `std::env::current_exe()` should not be trusted for security-sensitive operations

Relying on `std::env::current_exe()` for security-sensitive tasks can create race conditions and enable privilege escalation. If the path to the executable is saved and reused, an attacker could replace the original executable with a malicious version before it is executed again, which may lead to unintended code execution with the application's privileges.

No
Low
rust

Insecure temporary directory creation detected

This vulnerability occurs when an application uses hardcoded paths for temporary files, making them predictable. Attackers can exploit this by hijacking or manipulating the file, leading to data corruption, privilege escalation, or code execution.

Yes
Low
.NET

TLS Certificate Validation Disabled

The code disables certificate validation by forcing that server validation callbacks always return true, allowing HTTP connections, SOAP services or mTLS authentication processes accept any certificate, including invalid, expired, or maliciously forged ones. An attacker can exploit this weakness to perform man-in-the-middle attacks, intercept or alter encrypted traffic, steal sensitive data (like login credentials or API keys), or impersonate trusted servers.

No
Low
VB

TLS Certificate Validation Disabled

The code disables certificate validation by forcing that server validation callbacks always return true, allowing HTTP connections, SOAP services or mTLS authentication processes accept any certificate, including invalid, expired, or maliciously forged ones. An attacker can exploit this weakness to perform man-in-the-middle attacks, intercept or alter encrypted traffic, steal sensitive data (like login credentials or API keys), or impersonate trusted servers.

No
Low
.NET

Deprecated SSL Protocol Usage Detected

This vulnerability occurs when an application explicitly enables outdated and insecure SSL/TLS protocols via ServicePointManager.SecurityProtocol, either by directly referencing deprecated SecurityProtocolType values (e.g., Ssl3, Tls, Tls11) or by assigning their corresponding integer equivalents. An attacker could exploit this weakness by performing man-in-the-middle attacks, protocol downgrade attacks, or decryption of intercepted traffic due to weak cipher suites and vulnerabilities in older protocol versions.

No
Low
PY

HTTP Client misconfigured with SSL validation disabled

The HTTP client disables its default SSL certificate validation, making it susceptible to man-in-the-middle attacks. An attacker intercepting the connection could decrypt, modify, or steal sensitive data, including API keys and badge numbers.

No
Low
APEX

Insecure HTTP Request detected

The Apex code uses HTTP instead of HTTPS for callouts to external services. It could potentially transmit critical data, including credentials and sensitive information, in cleartext. Unauthorized actors can easily intercept unencrypted communication.

No
Low
VB

Deprecated SSL Protocol Usage Detected

This vulnerability occurs when an application explicitly enables outdated and insecure SSL/TLS protocols via ServicePointManager.SecurityProtocol, either by directly referencing deprecated SecurityProtocolType values (e.g., Ssl3, Tls, Tls11) or by assigning their corresponding integer equivalents. An attacker could exploit this weakness by performing man-in-the-middle attacks, protocol downgrade attacks, or decryption of intercepted traffic due to weak cipher suites and vulnerabilities in older protocol versions.

No
Low
PY

Dangerous use of assert

When running Python in production in optimized mode, assert calls are not executed. This mode is enabled by setting the PYTHONOPTIMIZE command line flag. Optimized mode is usually ON in production. Any safety check done using assert will not be executed.

Yes
Low
Swift

Disabling fraudulent site detection is unsafe

When preferences explicitly disable the fraudulent site warnings inherent to the WKWebView framework, it raises critical security concerns regarding exposure to deceptive online content such as Malware and Phishing pages.

Yes
Low
Swift

On-screen data should be hidden when backgrounding

The application fails to obscure on-screen data when it transitions to the background. This creates a significant risk that sensitive information displayed on the screen can be captured in a system-generated screenshot and revealed in the multi-tasker view.

No
Low
JS

Insecure websocket connection sends data over cleartext

A connection to a web socket server is established without TLS. Use the wss:// protocol to ensure the handshake does not happen over cleartext. An attacker on the local network could otherwise read data being transmitted between the client and websocket server.

No
Low
YAML

Use of NODE_AUTH_TOKEN to publish NPM packages in CI/CD

It appears that you use NODE_AUTH_TOKEN to publish NPM packages from your CI/CD. It is recommended to use trusted publishing instead, as it eliminates the need of long-lived npm tokens. This would limit the impact when a npm token is exposed to a threat actor (e.g. via malware, or other means).

No
    