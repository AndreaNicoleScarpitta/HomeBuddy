import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        let viewController = WebViewController()
        let navigationController = UINavigationController(rootViewController: viewController)
        navigationController.isNavigationBarHidden = true
        window?.rootViewController = navigationController
        window?.tintColor = UIColor(red: 249/255, green: 115/255, blue: 22/255, alpha: 1.0)
        window?.makeKeyAndVisible()
        return true
    }
}
