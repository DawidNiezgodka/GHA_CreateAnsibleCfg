const core = require('@actions/core');
const fs = require('fs');
const path = require("path");

try {
  // Get inputs from action
  const existingConfigFilePath = core.getInput('existing_config_file_path');
  const directoryPath = core.getInput('directory_path');
  const configFileName = core.getInput('config_file_name');

  const remoteUser = core.getInput('remote_user');
  const privateKeyPath = core.getInput('private_key_path');
  const inventoryFile = core.getInput('inventory_file') || "/ansible/hosts.cfg";
  const hostKeyChecking = core.getInput('host_key_checking') || 'False';
  const privilegeEscalation = core.getInput('privilege_escalation') || 'True';

  // If ansible config file is provided, use it and ignore other inputs
  if (existingConfigFilePath) {
    // Set ANSIBLE_CONFIG environment variable
    core.exportVariable("ANSIBLE_CONFIG", existingConfigFilePath);
    return;
  }

  createDirectoriesRecursively(directoryPath);

  // Prepare Ansible configuration content
    let ansibleConfigContent = `\n[defaults]\n`;
    if (hostKeyChecking) {
        ansibleConfigContent += `host_key_checking = ${hostKeyChecking}\n`;
    }
    if (remoteUser) {
        ansibleConfigContent += `remote_user = ${remoteUser}\n`;
    }
    ansibleConfigContent += `ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'\n`;
    if (inventoryFile) {
        ansibleConfigContent += `inventory = ${inventoryFile}\n`;
    }
    if (privateKeyPath) {
        ansibleConfigContent += `private_key_file = ${privateKeyPath}\n`;
    }

    ansibleConfigContent += `[privilege_escalation]\n`;
    if (privilegeEscalation) {
        ansibleConfigContent += `become = ${privilegeEscalation}\n`;
    }

  // Write to Ansible configuration file

  createConfigAndSetEnvVar(directoryPath, configFileName, ansibleConfigContent);
} catch (error) {
  core.setFailed(error.message);
}

async function createDirectoriesRecursively(path) {
  await fs.promises.mkdir(path, { recursive: true });
}

 function createConfigAndSetEnvVar(directoryPath, configFileName, fileContent) {
  // Create a full path for the config file
  const fullPath = path.join(directoryPath, configFileName);
  console.log("Full path is: " + fullPath);
  console.log("The content is: " + fileContent);
  fs.writeFileSync(fullPath, fileContent);

  // Set ANSIBLE_CONFIG environment variable
  core.exportVariable("ANSIBLE_CONFIG", fullPath);
}
