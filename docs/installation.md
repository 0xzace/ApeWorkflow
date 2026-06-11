# Installation

## Prerequisites

- **Node.js 20.19.0 or higher** — Check your version: `node --version`

## Package Managers

### npm

```bash
npm install -g @0xzace/apeworkflow@latest
```

### pnpm

```bash
pnpm add -g @0xzace/apeworkflow@latest
```

### yarn

```bash
yarn global add @0xzace/apeworkflow@latest
```

### bun

Bun can install ApeWorkflow globally, but ApeWorkflow currently runs on Node.js.
You still need Node.js 20.19.0 or higher available on `PATH`.

```bash
bun add -g @0xzace/apeworkflow@latest
```

## Nix

Run ApeWorkflow directly without installation:

```bash
nix run github:0xzace/ApeWorkflow -- init
```

Or install to your profile:

```bash
nix profile install github:0xzace/ApeWorkflow
```

Or add to your development environment in `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    apeworkflow.url = "github:0xzace/ApeWorkflow";
  };

  outputs = { nixpkgs, apeworkflow, ... }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      buildInputs = [ apeworkflow.packages.x86_64-linux.default ];
    };
  };
}
```

## Verify Installation

```bash
apeworkflow --version
```

## Next Steps

After installing, initialize ApeWorkflow in your project:

```bash
cd your-project
apeworkflow init
```

See [Getting Started](getting-started.md) for a full walkthrough.
