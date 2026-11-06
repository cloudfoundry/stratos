{
  description = "Bun + Angular Nix development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          name = "bun-angular-dev-shell";

          buildInputs = [
            pkgs.bun
            pkgs.nodejs_20
            pkgs.pnpm
            pkgs.git
            pkgs.openssl
            pkgs.watchman
          ];

          shellHook = ''
            echo "✅ Bun + Angular dev shell"
            echo "bun: $(bun --version)"
            echo "node: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo ""
            echo "If Angular CLI isn't installed:"
            echo "  npm install -g @angular/cli"
          '';
        };
      });
}
