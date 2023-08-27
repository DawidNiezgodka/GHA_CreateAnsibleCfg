const core = require('@actions/core');
const fs = require('fs');
const path = require("path");


try {
  // Get inputs from action
  const existingConfigFilePath = core.getInput('existing_config_file_path');
  const directoryPath = core.getInput('directory_path');
  const configFileName = core.getInput('config_file_name');

  const remoteUser = core.getInput('remote-user');
  const inventoryFile = core.getInput('inventory-file') || "/ansible/hosts.cfg";
  const hostKeyChecking = core.getInput('host-key-checking') || 'False';
  const privilegeEscalation = core.getInput('privilege-escalation') || 'True';

  // If ansible config file is provided, use it and ignore other inputs
  if (existingConfigFilePath) {
    // Set ANSIBLE_CONFIG environment variable
    process.env['ANSIBLE_CONFIG'] = existingConfigFilePath;
    return;
  }

  createDirectoriesRecursively(directoryPath);

  // Prepare Ansible configuration content
  let ansibleConfigContent = `
[defaults]
host_key_checking = ${hostKeyChecking}
remote_user = ${remoteUser}
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
inventory = ${inventoryFile}
[privilege_escalation]
become = ${privilegeEscalation}
`;

  // Write to Ansible configuration file
  createConfigAndSetEnvVar(directoryPath, configFileName, ansibleConfigContent);
} catch (error) {
  core.setFailed(error.message);
}

function createDirectoriesRecursively(path) {
  // Check if the directory exists
  fs.stat(path, (err, stats) => {
    // If it doesn't exist, create it
    if (err && err.code === 'ENOENT') {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) {
          console.error('An error occurred:', err);
        } else {
          console.log(`Successfully created directory: ${path}`);
        }
      });
    } else if (err) {
      // An error other than 'ENOENT' occurred
      console.error('An error occurred:', err);
    } else {
      // Directory exists
      if (stats.isDirectory()) {
        console.log(`Directory ${path} already exists.`);
      } else {
        console.log(`${path} exists but is not a directory.`);
      }
    }
  });
}

function createConfigAndSetEnvVar(directoryPath, configFileName, fileContent) {
  // Create a full path for the config file
  const fullPath = path.join(directoryPath, configFileName);

    // Write file to the directory
    fs.writeFile(fullPath, fileContent, 'utf8', (err) => {
      if (err) {
        return console.error('An error occurred while writing file:', err);
      }
      console.log(`Successfully saved file at ${fullPath}`);
    });

  // Set ANSIBLE_CONFIG environment variable
  process.env['ANSIBLE_CONFIG'] = fullPath;
}
