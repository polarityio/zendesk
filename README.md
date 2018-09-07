# Polarity Zendesk Integration

The Polarity Zendesk integration allows Polarity to search Zendesk to return any tickets that are contained in Zendesk.

## Zendesk Integration Options

### Zendesk URL

Base URL used to access your instance of Zendesk including the schema.

For example:

```
https://your_subdomain.zendesk.com
```

### Zendesk Username

Username used for the individual to access Zendesk.

### API Token

Zendesk API Token, can be generated from Admin->Channels->API as described here:

https://support.zendesk.com/hc/en-us/articles/226022787-Generating-a-new-API-token-


### Ticket Status

Select the ticket statuses you want to return results for.  For example, if set to "Open" and "Pending", only tickets that are in the "Open" or "Pending" state will be returned.

### Only Search My Tickets

If checked, the integration will only search tickets that have been assigned to your account (based on your username)

### Domain Black List Regex

Domains (including in email addresses) that match the given regex will not be searched (if blank, no domains will be black listed)

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making.  For more information about the Polarity platform please see:

https://polarity.io/
