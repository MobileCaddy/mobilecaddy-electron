# MobileCaddy Electron Support Package

Basic package that adds support for creating desktop apps for Salesforce using the [MobileCaddy](https://mobilecaddy.net) package.

See our [starter app](https://github.com/mobilecaddy/mobilecaddy-electron-starter) for an example app

Install with;
```
npm install --save mobilecaddy-electron
```

## Testing

```
npm run test
```

This runs up an electron app, from the _test_ dir. Uses test config and creates DB etc in that directory too.

Note if you see errors, you may need to rebuild the SQLite for your particular OS. This should be possible with the following steps...

To rebuild on windows you need to have a few tools in place (like Python etc). These can be installed with this;

```
npm install --global --production windows-build-tools
```

For other OS you might be good to go straight off the bat... and the rebuild can be kicked off with;

```
npm run rebuild
```
