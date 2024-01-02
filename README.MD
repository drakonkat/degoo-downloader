# Degoo downloader

## Description

This project is a JavaScript application that uses npm for package management. It interacts with the Degoo API to perform various operations.

## Installation

To install the project, follow these steps:

1. Clone the repository: `git clone https://github.com/username/repository.git`
2. Navigate to the project directory: `cd repository`
3. Install the dependencies: `npm install`

## Usage

To use the project, you need to obtain a refreshToken from Degoo. Here's how you can do it:

1. Go to the Degoo website and log in to your account.
2. Open the developer tools in your browser (usually F12 or Ctrl+Shift+I).
3. Navigate to the Network tab.
4. Refresh the page and look for a request to an endpoint that includes 'https://rest-api.degoo.com/access-token/v2' in the URL.
5. Click on the request and inspect the Response tab.
6. Look for a field named 'refreshToken' and copy its value.

Once you have the refreshToken, you can use it in the project as follows:

1. Open the `.env` file in the project root.
2. Set the `REFRESH_TOKEN` environment variable to the refreshToken value you copied.
3. Start the process to download everything: `npm run start`

## Contributing

If you want to contribute to this project, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
