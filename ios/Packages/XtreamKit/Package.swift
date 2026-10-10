// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "XtreamKit",
    platforms: [.iOS(.v17), .macOS(.v14), .tvOS(.v17)],
    products: [
        .library(name: "XtreamKit", targets: ["XtreamKit"])
    ],
    targets: [
        .target(name: "XtreamKit"),
        .testTarget(name: "XtreamKitTests", dependencies: ["XtreamKit"])
    ]
)
