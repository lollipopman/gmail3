![Travis](https://travis-ci.org/lollipopman/gmail3.svg?branch=master)

## gmail3 - Gmail Usage Analysis

This script analyzes your Gmail usage and provides a monthly report of where
your email comes from.

![Historical Email Volume](https://raw.github.com/lollipopman/gmail3/master/images/historical_email_volume.png)
![Top Mailing Lists](https://raw.github.com/lollipopman/gmail3/master/images/top_mailing_lists.png)

### Usage

1. Open the script: [gmail3](https://script.google.com/d/1zTItVofASkaDrLxX8ot-A_HpahnTLWL7v4RHIIYzWgUFbs0EC6zV4j5_/edit?usp=sharing)

1. Open up the main.gs file and run the main function, this will kick off the
   first run and when finished schedule a trigger in the future to run the
  script again. Once the first run is completed you can close the script and it
  should continue to run at regular intervals in Google's datacenters. Think of
  it as a cron job running at Google.

### Removal

To remove the script open it up and run the resetScriptState function.

### Development

1. Grab nodejs dependencies
```bash
npm install
```

1. Create a script project in your Google Drive called gmail3
  - Create the following files in the gmail3 project, their contents do not
    matter, but the file must exist for gas-manager to upload successfully.
      - main
      - gmail3
      - gmail3MsgConsumers
      - vendor-moment
      - vendor-lodash
      - vendor-objDB

1. Setup gas-manager to allow uploading to Google Drive
```bash
gas init
```

1. Remove the `files` section from gas-project.json, as this information is
   provided by the Makefile

1. Run `make` to upload your checked out copy

1. Make some changes

1. Run `make` to upload your changes.

1. Test you changes

1. Submit a pull request
