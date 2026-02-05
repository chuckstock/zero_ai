#!/usr/bin/env npx ts-node
/**
 * Word Duel Solver Example
 * 
 * Standalone Wordle solver using the SDK's word utilities.
 * Interactive CLI for testing strategies.
 * 
 * Usage:
 *   npx ts-node examples/solver.ts
 */

import { WordUtils, strategies } from '../src'
import * as readline from 'readline'

const wordUtils = new WordUtils()

interface Feedback {
  guess: string
  feedback: Array<'correct' | 'present' | 'absent'>
}

const history: Feedback[] = []

function printHeader() {
  console.log('\n🎯 Word Duel Solver')
  console.log('==================')
  console.log('Enter your guesses and feedback to get suggestions.')
  console.log('')
  console.log('Feedback format: 5 characters')
  console.log('  g = green (correct)')
  console.log('  y = yellow (present)')
  console.log('  . = gray (absent)')
  console.log('')
  console.log('Example: "crane" with feedback "..y.g" means:')
  console.log('  C=gray, R=gray, A=yellow, N=gray, E=green')
  console.log('')
  console.log('Commands:')
  console.log('  reset - start over')
  console.log('  hint  - get suggestion without adding guess')
  console.log('  stats - show remaining candidates')
  console.log('  quit  - exit')
  console.log('')
}

function parseFeedback(input: string): Array<'correct' | 'present' | 'absent'> {
  return input.split('').map(c => {
    switch (c.toLowerCase()) {
      case 'g': return 'correct'
      case 'y': return 'present'
      default: return 'absent'
    }
  })
}

function colorWord(word: string, feedback: Array<'correct' | 'present' | 'absent'>): string {
  return feedback.map((f, i) => {
    const letter = word[i].toUpperCase()
    switch (f) {
      case 'correct': return `\x1b[32m${letter}\x1b[0m`
      case 'present': return `\x1b[33m${letter}\x1b[0m`
      default: return `\x1b[90m${letter}\x1b[0m`
    }
  }).join('')
}

function getCandidates(): string[] {
  let candidates = wordUtils.getWordList()
  if (history.length > 0) {
    candidates = wordUtils.filterByFeedback(candidates, history)
  }
  return candidates
}

function getSuggestion(candidates: string[]): string {
  if (candidates.length === 0) return 'salet'
  if (candidates.length === 1) return candidates[0]
  
  // Use information theory
  const context = {
    gameState: {} as any,
    myGuesses: history,
    candidates,
    round: history.length + 1,
    wordUtils
  }
  
  return strategies.informationTheory.selectGuess(context)
}

function printStats(candidates: string[]) {
  console.log(`\n📊 ${candidates.length} possible words remaining`)
  
  if (candidates.length <= 20) {
    console.log('Candidates:', candidates.join(', '))
  } else if (candidates.length <= 50) {
    console.log('Top candidates:', candidates.slice(0, 20).join(', '), '...')
  }
}

async function main() {
  printHeader()
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const ask = (prompt: string): Promise<string> => {
    return new Promise(resolve => rl.question(prompt, resolve))
  }
  
  // Initial suggestion
  let candidates = getCandidates()
  console.log(`💡 Suggested first word: \x1b[1m${getSuggestion(candidates).toUpperCase()}\x1b[0m`)
  console.log('')
  
  while (true) {
    const input = await ask('> ')
    const trimmed = input.trim().toLowerCase()
    
    if (!trimmed) continue
    
    // Commands
    if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'q') {
      console.log('👋 Goodbye!')
      rl.close()
      break
    }
    
    if (trimmed === 'reset') {
      history.length = 0
      console.log('\n🔄 Reset! Starting fresh.')
      candidates = getCandidates()
      console.log(`💡 Suggested word: \x1b[1m${getSuggestion(candidates).toUpperCase()}\x1b[0m\n`)
      continue
    }
    
    if (trimmed === 'hint') {
      candidates = getCandidates()
      console.log(`💡 Suggestion: \x1b[1m${getSuggestion(candidates).toUpperCase()}\x1b[0m\n`)
      continue
    }
    
    if (trimmed === 'stats') {
      candidates = getCandidates()
      printStats(candidates)
      console.log('')
      continue
    }
    
    // Parse guess and feedback
    const parts = trimmed.split(/\s+/)
    
    if (parts.length < 2) {
      console.log('Usage: <word> <feedback>  (e.g., "crane ..y.g")')
      continue
    }
    
    const [guess, feedbackStr] = parts
    
    if (guess.length !== 5) {
      console.log('Word must be 5 letters')
      continue
    }
    
    if (feedbackStr.length !== 5) {
      console.log('Feedback must be 5 characters (g/y/.)')
      continue
    }
    
    const feedback = parseFeedback(feedbackStr)
    
    // Check for win
    if (feedback.every(f => f === 'correct')) {
      console.log(`\n🎉 Solved in ${history.length + 1} guesses!`)
      console.log('')
      history.length = 0
      candidates = getCandidates()
      console.log(`💡 Ready for next word: \x1b[1m${getSuggestion(candidates).toUpperCase()}\x1b[0m\n`)
      continue
    }
    
    // Add to history
    history.push({ guess, feedback })
    
    // Update candidates
    candidates = getCandidates()
    
    // Display
    console.log(`\n   ${colorWord(guess, feedback)}`)
    printStats(candidates)
    
    if (candidates.length === 0) {
      console.log('\n❌ No valid words match this feedback!')
      console.log('   Double-check your feedback entries.')
    } else if (candidates.length === 1) {
      console.log(`\n✅ Answer: \x1b[1m${candidates[0].toUpperCase()}\x1b[0m`)
    } else {
      const suggestion = getSuggestion(candidates)
      console.log(`\n💡 Try: \x1b[1m${suggestion.toUpperCase()}\x1b[0m`)
    }
    console.log('')
  }
}

main().catch(console.error)
