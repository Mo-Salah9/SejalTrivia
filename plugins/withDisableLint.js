const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

function withDisableLint(config) {
  // Disable lint abort on error in app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Add lint block after compileSdk line
    if (!buildGradle.includes('abortOnError false')) {
      config.modResults.contents = buildGradle.replace(
        /compileSdk rootProject\.ext\.compileSdkVersion/,
        `compileSdk rootProject.ext.compileSdkVersion

    lint {
        abortOnError false
        checkReleaseBuilds false
    }`
      );
    }

    return config;
  });

  // Increase JVM memory for Gradle
  config = withGradleProperties(config, (config) => {
    const props = config.modResults;
    const jvmArgsIndex = props.findIndex(
      (p) => p.type === 'property' && p.key === 'org.gradle.jvmargs'
    );
    if (jvmArgsIndex >= 0) {
      props[jvmArgsIndex].value = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';
    }
    return config;
  });

  return config;
}

module.exports = withDisableLint;
