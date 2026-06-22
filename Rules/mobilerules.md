Language

Description

AutoFix

Score

Android

Android app enables debug mode in production

The AndroidManifest.xml file is configured with 'android:debuggable' set to true. This introduces a security risk, as debuggable applications may expose sensitive information and weaken security measures.

Yes
Critical
Android

inputType might expose sensitive user input

Android apps cache keyboard input for autocomplete. This poses a risk of leaking sensitive information such as passwords to other apps.

No
High
Android

Improper SSL certificate validation

The AndroidManifest.xml file lacks any configuration of 'android:networkSecurityConfig', which improves SSL security. This vulnerability can allow attackers to conduct man-in-the-middle attacks.

No
High
iOS

iOS app disables Perfect Forward Secrecy for TLS

The Info.plist explicitly disabled PFS for encrypted connections, which guards against 'collect now, decrypt later' attacks.

No
High
iOS

Improper SSL certificate validation

The app does not verify with Certificate Authority has issued SSL certificates for encrypted connections.

No
High
Android

Improper android backup configuration

The application's AndroidManifest.xml file is configured with 'android:allowBackup' set to true. This setting enables the automatic backup of sensitive data, including cryptographic keys and user credentials.

Yes
Medium
Android

Android components with exported attribute active

The 'android:exported' sets whether a component (activity, service, broadcast receiver, etc.) can be launched by any other app. This configuration increases the risk of unauthorized access and data leakage.

Yes
Medium
iOS

iOS app allows unencrypted connections

The app allows unencrypted connections over HTTP, allowing for eavesdropping and making API reverse engineering easier.

Yes
Medium
iOS

Minimum TLS version is set to an older version

The info.plist file allows an older version of TLS (version 1.0, 1.1 or 1.2). These versions are outdated and can lead to your app traffic being more easily eavesdropped on.

No
Medium
iOS

WebView allows unencrypted connections

Info.plist manifest allows this app's WebViews to access content over unencrypted HTTP, allowing eavesdropping and data manipulation.

Yes
Medium
iOS

iOS app allows loading images and video over unencrypted connections

The app allows loading images and videos over unencrypted HTTP connection, causing potential leaks to others.

No
Medium
iOS

Certificate Transparency is not required for TLS

By requiring CT for each https connection, you defend your app against rogue CA issuing fake SSL certificates, defending your app against eavesdropping.

No
Medium
Android

Android app content provider should specify precise permissions

The AndroidManifest.xml contains a content provider that lacks proper permissions, as 'android:writePermission', 'android:readPermission' or 'android:permission' attributes are not appropriately set. This increases the risk of unauthorized access and data leakage to other apps.

No
Medium
Android

Android components with unspecified 'exported' attribute

The 'android:exported' sets whether a component (activity, service, broadcast receiver, etc.) can be launched by any other app. The AndroidManifest.xml file is not configured with a value for 'android:exported'. For older android versions, this defaults to true. This configuration increases the risk of unauthorized access and data leakage.

No
Medium
iOS

iOS app allows local networking

Local networking is usually only needed in development builds of your app. The attack surface of your app becomes smaller if this is disabled.

Yes
Low




