import Foundation
import Flutter
import UIKit

class RTCVideoViewFactory: NSObject, FlutterPlatformViewFactory {
    private var messenger: FlutterBinaryMessenger
    private var plugin: RTCVideoPlugin

    public func createArgsCodec() -> FlutterMessageCodec & NSObjectProtocol {
        FlutterStandardMessageCodec.sharedInstance()
    }

    init(messenger: FlutterBinaryMessenger, plugin: RTCVideoPlugin) {
        self.messenger = messenger
        self.plugin = plugin
        super.init()
    }
    
    func create(withFrame frame: CGRect, viewIdentifier viewId: Int64, arguments args: Any?) -> FlutterPlatformView {
        RTCVideoView(
                frame: frame,
                viewIdentifier: viewId,
                arguments: args,
                binaryMessenger: messenger,
                plugin: plugin
        )
    }
}
