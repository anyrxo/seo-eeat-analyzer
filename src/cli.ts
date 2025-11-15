#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import axios from 'axios';
import { EEATAnalyzer } from './analyzers/eat-analyzer.js';
import * as fs from 'fs/promises';

const program = new Command();

const banner = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ${chalk.cyan('███████╗███████╗ █████╗ ████████╗')}                        ║
║   ${chalk.cyan('██╔════╝██╔════╝██╔══██╗╚══██╔══╝')}                        ║
║   ${chalk.cyan('█████╗  █████╗  ███████║   ██║   ')}                        ║
║   ${chalk.cyan('██╔══╝  ██╔══╝  ██╔══██║   ██║   ')}                        ║
║   ${chalk.cyan('███████╗███████╗██║  ██║   ██║   ')}                        ║
║   ${chalk.cyan('╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ')}  ${chalk.white('Analyzer')}        ║
║                                                                ║
║   ${chalk.white('E-E-A-T & Answer Engine Optimization for 2025')}       ║
║   ${chalk.gray('Experience · Expertise · Authoritativeness · Trust')}   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;

program
  .name('eat-analyzer')
  .description('E-E-A-T analyzer and Answer Engine Optimization tracker')
  .version('1.0.0');

// Analyze command
program
  .command('analyze <url>')
  .description('Analyze a URL for E-E-A-T signals and AEO readiness')
  .option('--json', 'Output results as JSON')
  .action(async (url, options) => {
    console.log(banner);

    const spinner = ora('Fetching and analyzing content...').start();

    try {
      // Fetch URL
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EEATAnalyzer/1.0)'
        },
        timeout: 30000
      });

      const html = response.data;
      const analyzer = new EEATAnalyzer();
      const result = analyzer.analyze(html, url);

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      // Display results
      console.log(chalk.cyan('\n📊 E-E-A-T Score Analysis\n'));

      // Score table
      const scoreTable = new Table({
        head: ['Metric', 'Score', 'Status'],
        colWidths: [25, 10, 15]
      });

      const getScoreColor = (score: number) => {
        if (score >= 80) return chalk.green;
        if (score >= 60) return chalk.yellow;
        return chalk.red;
      };

      const getStatus = (score: number) => {
        if (score >= 80) return chalk.green('✓ Excellent');
        if (score >= 60) return chalk.yellow('⚠ Good');
        return chalk.red('✗ Needs Work');
      };

      scoreTable.push(
        ['Experience', getScoreColor(result.eatScore.experience)(result.eatScore.experience), getStatus(result.eatScore.experience)],
        ['Expertise', getScoreColor(result.eatScore.expertise)(result.eatScore.expertise), getStatus(result.eatScore.expertise)],
        ['Authoritativeness', getScoreColor(result.eatScore.authoritativeness)(result.eatScore.authoritativeness), getStatus(result.eatScore.authoritativeness)],
        ['Trustworthiness', getScoreColor(result.eatScore.trustworthiness)(result.eatScore.trustworthiness), getStatus(result.eatScore.trustworthiness)],
        [chalk.white.bold('Overall E-E-A-T'), getScoreColor(result.eatScore.overall).bold(result.eatScore.overall), getStatus(result.eatScore.overall)]
      );

      console.log(scoreTable.toString());

      // AEO Readiness
      console.log(chalk.cyan('\n\n🤖 Answer Engine Optimization (AEO) Readiness\n'));

      const aeoTable = new Table({
        head: ['Platform', 'Score', 'Readiness'],
        colWidths: [20, 10, 25]
      });

      aeoTable.push(
        ['ChatGPT', getScoreColor(result.aeoReadiness.chatgpt)(result.aeoReadiness.chatgpt), getStatus(result.aeoReadiness.chatgpt)],
        ['Perplexity', getScoreColor(result.aeoReadiness.perplexity)(result.aeoReadiness.perplexity), getStatus(result.aeoReadiness.perplexity)],
        ['Google AI Overviews', getScoreColor(result.aeoReadiness.googleAI)(result.aeoReadiness.googleAI), getStatus(result.aeoReadiness.googleAI)]
      );

      console.log(aeoTable.toString());

      // Issues
      if (result.issues.length > 0) {
        console.log(chalk.cyan('\n\n⚠️  Issues Found\n'));

        result.issues.forEach((issue, idx) => {
          const severityColor = {
            critical: chalk.red.bold,
            high: chalk.magenta.bold,
            medium: chalk.yellow.bold,
            low: chalk.blue.bold
          }[issue.severity];

          console.log(`${idx + 1}. ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.message}`);
          if (issue.element) {
            console.log(`   ${chalk.gray('Element:')} ${issue.element}`);
          }
          console.log(`   ${chalk.green('Fix:')} ${issue.fix}`);
          console.log('');
        });
      }

      // Structured Data
      if (result.structuredData.found.length > 0 || result.structuredData.missing.length > 0) {
        console.log(chalk.cyan('\n📐 Structured Data Analysis\n'));

        if (result.structuredData.found.length > 0) {
          console.log(chalk.green('✓ Found: ') + result.structuredData.found.join(', '));
        }

        if (result.structuredData.missing.length > 0) {
          console.log(chalk.yellow('⚠ Missing: ') + result.structuredData.missing.join(', '));
        }

        if (result.structuredData.issues.length > 0) {
          console.log(chalk.red('\nStructured Data Issues:'));
          result.structuredData.issues.forEach((issue, idx) => {
            console.log(`  ${idx + 1}. [${issue.type}] ${issue.message}`);
            console.log(`     ${chalk.green('Fix:')} ${issue.fix}`);
          });
        }
      }

      // Recommendations
      if (result.recommendations.length > 0) {
        console.log(chalk.cyan('\n\n💡 Recommendations\n'));

        result.recommendations.forEach((rec, idx) => {
          console.log(`${chalk.white(`${idx + 1}.`)} ${rec}`);
        });
      }

      // Overall result
      console.log('\n' + '═'.repeat(66) + '\n');

      if (result.eatScore.overall >= 80) {
        console.log(chalk.green.bold('✓ EXCELLENT') + chalk.gray(' - Strong E-E-A-T signals detected'));
      } else if (result.eatScore.overall >= 60) {
        console.log(chalk.yellow.bold('⚠ GOOD') + chalk.gray(' - Solid foundation, room for improvement'));
      } else {
        console.log(chalk.red.bold('✗ NEEDS WORK') + chalk.gray(' - Significant E-E-A-T improvements needed'));
      }

      console.log('');

    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      if (axios.isAxiosError(error)) {
        console.error(chalk.red(`Error fetching URL: ${error.message}`));
      } else {
        console.error(chalk.red((error as Error).message));
      }
      process.exit(1);
    }
  });

// Analyze file command
program
  .command('analyze-file <filepath>')
  .description('Analyze an HTML file for E-E-A-T signals')
  .option('--json', 'Output results as JSON')
  .action(async (filepath, options) => {
    if (!options.json) {
      console.log(banner);
    }

    const spinner = options.json ? null : ora('Analyzing HTML file...').start();

    try {
      const html = await fs.readFile(filepath, 'utf-8');
      const analyzer = new EEATAnalyzer();
      const result = analyzer.analyze(html, filepath);

      if (spinner) {
        spinner.succeed(chalk.green('Analysis complete'));
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(chalk.cyan('\n📊 E-E-A-T Score: ') + chalk.white.bold(result.eatScore.overall));
        console.log(chalk.cyan('Issues Found: ') + chalk.white(result.issues.length));
        console.log(chalk.cyan('Recommendations: ') + chalk.white(result.recommendations.length));
      }

    } catch (error) {
      if (spinner) {
        spinner.fail(chalk.red('Analysis failed'));
      }
      if (!options.json) {
        console.error(chalk.red((error as Error).message));
      } else {
        console.error(JSON.stringify({ error: (error as Error).message }));
      }
      process.exit(1);
    }
  });

program.parse();
