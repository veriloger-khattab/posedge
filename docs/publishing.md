# Publishing Posedge

Posedge is published in two places with the same `.vsix` file:

| Store | Who uses it | Listing |
|---|---|---|
| Visual Studio Marketplace | VS Code | `ahmedkhattab.posedge` |
| Open VSX | Cursor, VSCodium, Windsurf, Gitpod and others | `ahmedkhattab/posedge` |

Cursor has no store of its own to publish to. It lists extensions from its mirror of Open VSX, so an Open VSX release
appears in Cursor by itself, sometimes a day or more later.

The publisher ID `ahmedkhattab` and the extension name `posedge` are permanent. The publisher's display name,
**Ahmed Khattab**, is what people see under the extension's title.

Only the project owner can do the steps marked **owner**: they need accounts, agreements and access tokens. Never paste a
token into a chat, a file in this repository or a command that gets saved in a script.

## One-time setup (owner)

### Visual Studio Marketplace

1. Open [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) and sign in with a Microsoft account.
2. Choose **Create publisher** and fill in:
   - **ID:** `ahmedkhattab` exactly. It cannot be changed later, and it must match `publisher` in `package.json`.
   - **Name:** `Ahmed Khattab`. This is the name shown on the listing.
3. Save. No access token is needed for uploading by hand, which is the route this project uses: Microsoft retires Azure
   DevOps personal access tokens on December 1, 2026.

### Open VSX

1. Create an Eclipse account at [accounts.eclipse.org/user/register](https://accounts.eclipse.org/user/register). Fill in the
   **GitHub Username** field with `veriloger-khattab`: it must be the same GitHub account you log in to Open VSX with.
2. Open [open-vsx.org](https://open-vsx.org) and log in with that GitHub account.
3. Go to **Settings → Profile**, choose **Log in with Eclipse**, then **Show Publisher Agreement**, read it and choose
   **Agree**.
4. Go to **Settings → Access Tokens**, choose **Generate New Token**, and copy the token. It is shown only once.
5. After the first release is up, ask for the verified mark: open an issue at
   [github.com/EclipseFdn/open-vsx.org](https://github.com/EclipseFdn/open-vsx.org/issues/new/choose) claiming the
   namespace `ahmedkhattab`. Until someone owns the namespace, the listing shows a warning that it is unverified.

## Every release

1. Bump `version` in `package.json`, and update `CHANGELOG.md` and `AGENTS.md`.
2. Build and check:

   ```bash
   npm run package
   ```

   ```bash
   npm test
   ```

3. Try `dist-vsix/posedge-<version>.vsix` in a real VS Code.
4. Commit and push. The stores load the README's images from GitHub, so the push comes before the upload.
5. **Owner, Visual Studio Marketplace:** at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage),
   open the publisher. For the first release choose **New extension → Visual Studio Code**; for later ones choose
   **… → Update** on the Posedge row. Upload `dist-vsix/posedge-<version>.vsix`. Verification takes a few minutes.
6. **Owner, Open VSX:** in your own terminal, set the token for that terminal session only, then publish.

   PowerShell:

   ```powershell
   $env:OVSX_PAT = "paste-your-token-here"
   ```

   ```bash
   npm run publish:openvsx
   ```

   The script creates the namespace on the first release and uploads the same `.vsix`.
7. Check both listings: the screenshots load, the name under the title reads **Ahmed Khattab**, and the description ends
   with "Designed by Ahmed Khattab."
8. Attach the `.vsix` files to a GitHub release, for people who install offline.

## The Lite edition

`npm run package:lite` builds `dist-vsix/posedge-lite-<version>.vsix`, the themes and icons with no code. It can be listed
as a second extension, `ahmedkhattab.posedge-lite`, by uploading that file the same way. Until then it is offered on the
GitHub releases page.

## If something goes wrong

- **"The extension 'name' already exists":** the name or display name is taken in that store. Both were free on
  2026-11-15.
- **Images are broken on the listing:** the commit with the images was not pushed before publishing, or an image is an
  SVG. `npm test` checks that every README image is a PNG in the repository.
- **Not in Cursor yet:** Cursor's mirror can lag. Meanwhile, download the `.vsix` from the Open VSX page and use
  *Extensions: Install from VSIX...*
- **A bad release:** publish a fixed version with a higher number. In the Marketplace, a single version can also be removed
  under **… → Reports**; removing the whole extension reserves its name forever, so avoid that.
