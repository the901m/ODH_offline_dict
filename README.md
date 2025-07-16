# Local Dictd Dictionary for Chrome/Firefox Extension

This project provides a setup to use your local `dictd` server as a dictionary source for the [ODH (Online Dictionary Helper)](https://github.com/ninja33/ODH) browser extension. This allows you to get instant word definitions with a pop-up on text selection, leveraging your self-hosted dictionary databases.

## Table of Contents
1.  [Features](#features)
2.  [Prerequisites](#prerequisites)
3.  [Installation & Setup](#installation--setup)
    * [Step 1: Set up `dictd` Server](#step-1-set-up-dictd-server)
    * [Step 2: Set up the HTTP Proxy (Python Flask)](#step-2-set-up-the-http-proxy-python-flask)
    * [Step 3: Configure the Browser Extension (ODH)](#step-3-configure-the-browser-extension-odh)
4.  [Troubleshooting](#troubleshooting)
5.  [Contributing](#contributing)
6.  [License](#license)
7.  [Acknowledgements](#acknowledgements)

## Features
* **Local Dictionary Lookups:** Utilize your self-hosted `dictd` server for definitions.
* **Seamless Integration:** Works with the ODH browser extension for pop-up definitions on text selection.
* **Offline Capability:** Once `dictd` and its databases are set up, you can look up words without an internet connection.

## Prerequisites
Before you begin, ensure you have the following installed on your system:

* **Chrome or Firefox Browser:** The ODH extension is available for both.
* **`dictd` Server:** The dictionary daemon.
    * **Linux:** Typically installed via your distribution's package manager (e.g., `apt`, `dnf`, `pacman`).
    * **Windows:** Recommended to use [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/install) and follow Linux instructions within WSL.
    * **macOS:** Can be installed via [Homebrew](https://brew.sh/) (`brew install dictd`).
* **Python 3 & `pip`:** For running the HTTP proxy.
* **`git` (Optional but Recommended):** To clone this repository.

## Installation & Setup

Follow these steps carefully to get your local `dictd` dictionary working with the ODH extension.

### Step 1: Set up `dictd` Server

This step involves installing the `dictd` daemon and your desired dictionary databases, then configuring it.

1.  **Install `dictd` and Dictionary Databases:**
    Open your terminal and install `dictd` along with some common dictionaries. Replace `apt` with your distribution's package manager (`dnf` for Fedora/RHEL, `pacman` for Arch Linux).

    ```bash
    # Update package lists
    sudo apt update

    # Install dictd server
    sudo apt install dictd

    # Install common dictionary databases (e.g., WordNet, GCIDE)
    sudo apt install dict-wordnet dict-gcide
    # You can install more dict- packages as desired
    ```

2.  **Configure `dictd.conf`:**
    The main configuration file for `dictd` is usually `/etc/dictd/dictd.conf` or `/etc/dict/dictd.conf`. **Based on recent experience on Arch Linux, your system might use `/etc/dict/dictd.conf`.**

    Open the configuration file with a text editor (e.g., `nano`):
    ```bash
    sudo nano /etc/dict/dictd.conf
    # OR
    # sudo nano /etc/dictd/dictd.conf
    ```

3.  **Configure `dictd` Locale:**
    As per the Arch Wiki, `dictd` needs to know your system's locale. This is done by passing arguments to the `dictd` executable via its `systemd` service configuration, not its main config file.

    * **Determine your locale:**
        ```bash
        locale
        ```
        Look for `LANG` or `LC_ALL` (e.g., `en_US.UTF-8`, `fa_IR.UTF-8`).
        You can also check available generated locales: `localectl list-locales`.

    * **Create/Edit `/etc/default/dictd`:** This file is sourced by the `dictd` systemd service.
        ```bash
        sudo nano /etc/default/dictd
        ```
        Add or modify the `DICTD_ARGS` line with your determined locale. For example:
        ```
        # Configuration file for dictd
        # Set custom arguments for dictd here.
        DICTD_ARGS="--locale fa_IR.UTF-8"
        # Or, if you prefer en_US.UTF-8 and it's generated:
        # DICTD_ARGS="--locale en_US.UTF-8"
        ```
        Save and exit the file.

4.  **Reload Systemd Daemon & Restart `dictd`:**
    After making configuration changes, `systemd` needs to reload its daemon and restart the `dictd` service.
    ```bash
    sudo systemctl enable dictd # to automatically start on boot
    sudo systemctl restart dictd
    ```

5.  **Verify `dictd` Status:**
    Check if `dictd` is running without errors:
    ```bash
    sudo systemctl status dictd
    ```
    It should show `Active: active (running)`. You can also test it with the `dict` command-line client: `dict test`.

### Step 2: Set up the HTTP Proxy (Python Flask)

Your browser extension cannot directly communicate with `dictd`. This Python Flask script acts as an HTTP proxy, translating web requests into DICT protocol commands.

1.  **Clone this repository (if you haven't already):**
    ```bash
    git clone https://github.com/the901m/ODH_offline_dict.git
    cd ODH_offline_dict
    ```

2.  **Create a Python Virtual Environment:**
    It's good practice to install Python dependencies in a virtual environment to avoid conflicts with your system's Python packages.
    ```bash
    python3 -m venv venv
    source venv/bin/activate # On Windows: .\venv\Scripts\activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install Flask
    ```
4.  **Run the HTTP Proxy:**
    With your virtual environment activated, run the Flask application:
    ```bash
    python main.py
    ```
    You should see output similar to `Running on http://127.0.0.1:8000` (or `localhost:8000`). Keep this terminal window open as long as you want the proxy to be available.
    * you can change the port by editing `main.py`.

### Step 3: Configure the Browser Extension (ODH)

Now, you'll integrate the JavaScript client script into the ODH extension.

1.  **Install the ODH Extension:**
    If you haven't already, install the ODH (Online Dictionary Helper) extension from your browser's respective store:
    
    * [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/anki-online-dictionary-he/lppjdajkacanlmpbbcdkccjkdbpllajb?hl=en)
    * [Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/online-dictionary-helper/)

3.  **Access ODH Settings:**
    * Click the puzzle piece icon (or similar extensions icon) in your browser toolbar.
    * Find "Online Dictionary Helper" and click the three dots or gear icon next to it.
    * Select "Options" or "Extension options".

4.  **Add a Custom Dictionary Script:**
    * In the ODH options, look for a section related to "User Defined Scripts" on Scripts tab.
    * paste [my .js script link](https://raw.githubusercontent.com/the901m/ODH_offline_dict/refs/heads/main/LocalDictClient.js).

5.  **Load Scripts:**
    * simply click on Load Scripts and Save & Close.

6.  **Enable and Prioritize the New Dictionary:**
    * enable it by clicking on extention Icon and select en_LocalDictdclient.

7.  **Test in Browser:**
    * Open any webpage in Chrome or Firefox.
    * Select a word (e.g., "test", "hello", "dictionary").
    * The ODH extension should now display a pop-up with the definition from your local `dictd` server.
    * **Crucially, open your browser's Developer Tools (F12) and check the "Console" tab** for any errors from the extension or your script.

## Troubleshooting
* **"Failed to fetch" or CORS Errors in Browser Console:**
    * This means your browser extension (or the test HTML page) cannot connect to your Python Flask proxy.
    * **Is the Flask Proxy Running?** Ensure you have a terminal open and `python dictd_http_proxy.py` is actively running without errors.
    * **CORS Headers:** Verify that the `Flask-Cors` library is correctly installed and initialized in `dictd_http_proxy.py` (`CORS(app)`). This adds the necessary `Access-Control-Allow-Origin: *` header.
    * **Port Conflict:** Ensure port `8000` (or whatever you configured) is not being used by another application.
    * **Firewall:** Check if your system's firewall is blocking port `8000`.
    * **Testing HTML File:** If you're testing `dictd_test.html` by opening it directly (`file:///`), it's highly recommended to serve it via a simple local web server (e.g., `python -m http.server 8001`) to avoid `null` origin CORS issues.

* **"No definition found" or Unexpected Output:**
    * **Proxy to `dictd` Connection:** Check the terminal where your Python Flask proxy is running. Does it show errors trying to connect to `dictd` (e.g., `ConnectionRefusedError`)? This means `dictd` itself isn't running or isn't accessible on `localhost:2628`.
    * **`dictd` Database Issues:** If the proxy connects but `dictd` returns "No match," it means `dictd` couldn't find the word in its configured databases. Verify your `dictd.conf` database entries and test `dict <word>` directly in the terminal.
    * **Parsing Errors:** While the proxy has basic parsing, complex `dictd` responses might not be fully handled. Check the raw `full_response` in the proxy's `console.log` for debugging.

## Contributing

Feel free to open issues or submit pull requests if you have improvements, bug fixes, or alternative proxy implementations (e.g., Node.js, Go).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

* Every part of this repository vibe coded with Gemini AI 2.5 Flash. the README revised by me.
* ODH extention. [Link to their github repository](https://github.com/ninja33/ODH)
* ArchWiki for dictd article. [link to the article](https://wiki.archlinux.org/title/Dictd)
