import Foundation
import MarketplaceValidatorCore

let cli = MarketplaceValidatorCLI()
exit(Int32(cli.run(arguments: Array(CommandLine.arguments.dropFirst()))))
