# Wirecutter Union Library

This repository is responsible for the configuration and deployment
of the [Library](https://github.com/nytimes/library.git) instance
for the Wirecutter Union. As of 12/23/2022, this repository actually
deploys the
[newsguildny/library](https://github.com/newsguildny/library.git)
fork of Library in order to support hosting Library at a subpath of
[https://nytimesguild.org/](nytimesguild.org). Once
[the PR](https://github.com/nytimes/library/pull/334) to add this
support upstream is merged, the .github/workflows/deploy.yml
configuration can be updated to use the upstream repo.

## How it works

### Customizing Library

The docs for how customization works in Library can be found
[here](https://github.com/nytimes/library/blob/master/custom/README.md).

The `styles/` directory and `strings.yaml` file are the standard
UI customization entrypoints. Changes to these files will change the
styles and markup rendered by the Library backend.

### User authentication

By default, Library uses Google OAuth and passport to authenticate users.
For our NYTimes Guild Library sites, we prefer to use Google's
[Identity-Aware Proxy](https://cloud.google.com/iap/docs/concepts-overview)
(IAP), which allows us to give arbitrary principals (in the form of
individual users and Google groups) access to each Library instance as
needed, through the Google Cloud Console.

IAP executes its own OAuth flow, so we implement our own custom
`userAuth.js` that simply validates the JWT authentication tokens it
receives from IAP.

### Deployment

This repo also contains a GitHub Action for deploying the Library instance
to Google App Engine. The load balancer and IAP are configured separately
in GCP; this repo is only concerned with deploying this App Engine service.

The actual application code for Library doesn't live in this repository;
instead, the Action clones the Library repo and configures this repo as the
customization repo.

The Action configures the deployed environment via a `.env` file. The values
are all either hard coded or stored in GitHub Repository Secrets. The Library
repo has an app.yaml file already in it that simply configures a runtime and
instance size, so we have a step that adds a service name configuration (so
that this isn't deployed to the default instance). It then uses
the GCloud CLI to deploy the app.
