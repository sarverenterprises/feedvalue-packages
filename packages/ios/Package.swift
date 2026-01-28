// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FeedValue",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "FeedValue",
            targets: ["FeedValue"]
        ),
    ],
    targets: [
        .target(
            name: "FeedValue",
            dependencies: [],
            path: "Sources/FeedValue"
        ),
        .testTarget(
            name: "FeedValueTests",
            dependencies: ["FeedValue"],
            path: "Tests/FeedValueTests"
        ),
    ]
)
