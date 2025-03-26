import { Client, Account, Databases } from 'appwrite';
const client = new Client();
client.setProject('67e0efd00036b848eee4');
client.setEndpoint('https://cloud.appwrite.io/v1')
const account = new Account(client)
const databases = new Databases(client);

export {account, databases}