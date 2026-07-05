// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MarketplaceValidator",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "marketplace-validator", targets: ["MarketplaceValidator"]),
        .library(name: "MarketplaceValidatorCore", targets: ["MarketplaceValidatorCore"]),
    ],
    targets: [
        .target(name: "MarketplaceValidatorCore"),
        .executableTarget(
            name: "MarketplaceValidator",
            dependencies: ["MarketplaceValidatorCore"]
        ),
        .testTarget(
            name: "MarketplaceValidatorTests",
            dependencies: ["MarketplaceValidatorCore"],
            path: "tests/MarketplaceValidatorTests"
        ),
    ]
)
