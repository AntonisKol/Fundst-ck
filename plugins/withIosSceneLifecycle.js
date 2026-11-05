const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

// Apps built with the iOS 27 SDK fail to launch unless they adopt the scene life
// cycle. Expo ships the scene delegate (ExpoAppSceneDelegate), but its SDK 57
// template doesn't use it yet, so wire it up here. Remove this plugin once the
// generated AppDelegate has no UIWindow of its own.

const CLASS_DECLARATION = "class AppDelegate: ExpoAppDelegate {";
const PATCHED_CLASS_DECLARATION = "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {";
// The scene delegate creates the window and starts React Native in it.
const WINDOW_SETUP = /#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)[\s\S]*?#endif\n\n/;

const patchAppDelegate = (contents) => {
  if (contents.includes(PATCHED_CLASS_DECLARATION)) return contents;
  if (!contents.includes(CLASS_DECLARATION) || !WINDOW_SETUP.test(contents)) {
    throw new Error("withIosSceneLifecycle: AppDelegate.swift doesn't match the expected template. Check whether Expo now adopts the scene life cycle.");
  }
  return contents.replace(CLASS_DECLARATION, PATCHED_CLASS_DECLARATION).replace(WINDOW_SETUP, "");
};

const withIosSceneLifecycle = (config) => {
  config = withAppDelegate(config, (mod) => {
    mod.modResults.contents = patchAppDelegate(mod.modResults.contents);
    return mod;
  });

  return withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default",
            // The Objective-C name ExpoAppSceneDelegate is exported under.
            UISceneDelegateClassName: "EXExpoAppSceneDelegate",
          },
        ],
      },
    };
    return mod;
  });
};

module.exports = withIosSceneLifecycle;
