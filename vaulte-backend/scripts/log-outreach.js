#!/usr/bin/env node

/**
 * Vaulté Outreach Tracking CLI
 * 
 * This script helps log outreach activities to the tracking CSV file.
 * It provides an interactive CLI to quickly add new entries or update existing ones.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CSV_PATH = path.join(__dirname, '../../docs/user-outreach-tracking.csv');
const BUYERS = [
  'HealthTech Research Institute',
  'FinanceAI Solutions',
  'HealthSync Technologies',
  'PrudentLife Insurance',
  'DataDriven Insights',
  'Behavioral Economics Lab',
  'SocialMetrics Research',
  'RetailInsight',
  'MicroLending Solutions',
  'ConsumerPulse Indonesia'
];

const CHANNELS = ['Email', 'LinkedIn', 'Twitter', 'Discord', 'Phone', 'Other'];
const STATUSES = ['Planned', 'Sent', 'Replied', 'Booked', 'Completed', 'No Response', 'Declined'];
const TEMPLATES = [
  'Email Initial A',
  'Email Initial B',
  'Email Value-Focused',
  'Email Follow-up #1',
  'Email Follow-up #2',
  'LinkedIn Connection Note',
  'LinkedIn Initial DM',
  'LinkedIn Follow-up',
  'Twitter DM',
  'Discord Message',
  'Custom'
];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt for input with default value
function prompt(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Helper to prompt for selection from a list
async function promptSelect(question, options) {
  console.log(`\n${question}`);
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });
  
  const answer = await prompt('Enter number');
  const selection = parseInt(answer, 10);
  
  if (isNaN(selection) || selection < 1 || selection > options.length) {
    console.log('Invalid selection. Please try again.');
    return promptSelect(question, options);
  }
  
  return options[selection - 1];
}

// Read existing CSV data
function readCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    return ['Name,Handle,Channel,Status,Date,Time,Timezone,Booked Link,Interview Link,Incentive Sent,Notes'];
  }
  
  const data = fs.readFileSync(CSV_PATH, 'utf8');
  return data.split('\n').filter(line => line.trim());
}

// Write data back to CSV
function writeCsv(lines) {
  fs.writeFileSync(CSV_PATH, lines.join('\n'), 'utf8');
}

// Add a new entry to the CSV
async function addEntry() {
  console.log('\n=== Add New Outreach Entry ===');
  
  const name = await promptSelect('Select buyer:', BUYERS);
  const handle = await prompt('Contact handle/email');
  const channel = await promptSelect('Select channel:', CHANNELS);
  const status = await promptSelect('Select status:', STATUSES);
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const date = await prompt('Date (YYYY-MM-DD)', dateStr);
  
  const timeStr = `${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;
  const time = await prompt('Time (HH:MM)', timeStr);
  
  const timezone = await prompt('Timezone', 'Asia/Jakarta');
  const template = await promptSelect('Template used:', TEMPLATES);
  
  let bookedLink = '';
  let interviewLink = '';
  
  if (status === 'Booked' || status === 'Completed') {
    bookedLink = await prompt('Calendly booking link');
    if (status === 'Completed') {
      interviewLink = await prompt('Interview notes link');
    }
  }
  
  const incentiveSent = status === 'Completed' ? 
    await prompt('Incentive sent (Yes/No)', 'No') : '';
  
  const notes = await prompt('Notes', `Template: ${template}, Tag: BuyerCall`);
  
  // Create CSV line
  const newLine = [
    name,
    handle,
    channel,
    status,
    date,
    time,
    timezone,
    bookedLink,
    interviewLink,
    incentiveSent,
    `"${notes}"`
  ].join(',');
  
  // Add to CSV
  const lines = readCsv();
  lines.push(newLine);
  writeCsv(lines);
  
  console.log('\n✅ Entry added successfully!');
  return true;
}

// Update an existing entry
async function updateEntry() {
  const lines = readCsv();
  if (lines.length <= 1) {
    console.log('No entries to update.');
    return false;
  }
  
  console.log('\n=== Update Existing Entry ===');
  console.log('\nExisting entries:');
  
  // Show existing entries (skip header)
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(',');
    console.log(`${i}. ${fields[0]} - ${fields[3]} (${fields[4]})`);
  }
  
  const indexStr = await prompt('Enter entry number to update (or 0 to cancel)');
  const index = parseInt(indexStr, 10);
  
  if (index === 0 || isNaN(index) || index >= lines.length) {
    console.log('Update canceled or invalid entry.');
    return false;
  }
  
  // Parse the selected line
  const fields = lines[index].split(',');
  
  console.log(`\nUpdating entry for: ${fields[0]}`);
  const status = await promptSelect('New status:', STATUSES);
  fields[3] = status;
  
  if (status === 'Booked' || status === 'Completed') {
    fields[7] = await prompt('Calendly booking link', fields[7]);
    
    if (status === 'Completed') {
      fields[8] = await prompt('Interview notes link', fields[8]);
      fields[9] = await prompt('Incentive sent (Yes/No)', fields[9] || 'No');
    }
  }
  
  // Update notes
  fields[10] = `"${await prompt('Notes', fields[10].replace(/"/g, ''))}"`;
  
  // Update the line
  lines[index] = fields.join(',');
  writeCsv(lines);
  
  console.log('\n✅ Entry updated successfully!');
  return true;
}

// Main function
async function main() {
  console.log('\n🚀 Vaulté Outreach Tracking CLI');
  
  try {
    let continueRunning = true;
    
    while (continueRunning) {
      const action = await promptSelect('Select action:', [
        'Add new outreach entry',
        'Update existing entry',
        'Exit'
      ]);
      
      if (action === 'Add new outreach entry') {
        await addEntry();
      } else if (action === 'Update existing entry') {
        await updateEntry();
      } else {
        continueRunning = false;
      }
      
      if (continueRunning) {
        const answer = await prompt('\nContinue with another action? (y/n)', 'y');
        continueRunning = answer.toLowerCase() === 'y';
      }
    }
    
    console.log('\n👋 Goodbye! Happy outreaching!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

// Run the script
main();