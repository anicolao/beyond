{
  description = "Beyond the Sun development and verification tools";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in { devShells.default = pkgs.mkShell {
        packages = with pkgs; [ bun nodejs jdk git gh python3 ripgrep ];
        shellHook = ''
          export XDG_CACHE_HOME="$PWD/.firebase/cache"
          # Playwright's browser targets the pinned OS image, not Nix glibc.
          # Probe it with that OS's loader without replacing other Nix tools.
          if [ -x /usr/bin/ldd ]; then
            mkdir -p "$PWD/.firebase/system-tools"
            ln -sf /usr/bin/ldd "$PWD/.firebase/system-tools/ldd"
            export PATH="$PWD/.firebase/system-tools:$PATH"
          fi
        '';
      }; });
}
