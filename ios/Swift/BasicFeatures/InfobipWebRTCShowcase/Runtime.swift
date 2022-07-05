import Foundation

class Runtime {
    static func simulator() -> Bool {
        return 0 != TARGET_OS_SIMULATOR
    }
}
