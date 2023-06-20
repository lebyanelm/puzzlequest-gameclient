import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Manager, Socket } from 'socket.io-client';
import axios from 'axios';
import { nanoid } from 'nanoid';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  sentence: any;
  Object: any = Object;
  session_id = nanoid();
  toastMessage: any = null;

  manager = new Manager(environment.backend, { path: '' });
  socket: Socket;

  constructor() {
    this.socket = this.manager.socket('/', {});
    this.socket.connect();

    this.socket.on('keydown', (data) => {
      this.sentence = data;
    });

    this.socket.on('input_completed', (data) => {
      const completedInput: HTMLInputElement | null = document.querySelector(
        '#' + data
      );
      if (completedInput) {
        completedInput.value = data;
        completedInput.disabled = true;

        this.toastMessage = 'Your partner found the word: ' + data;
        setTimeout(() => (this.toastMessage = null), 5000);
      }
    });

    this.getCurrentActiveSentence().then(
      (sentence: any) => (this.sentence = sentence)
    );
  }

  getCurrentActiveSentence() {
    return new Promise((resolve, reject) => {
      axios
        .get([environment.backend, 'words', 'sentence'].join('/'))
        .then((response) => {
          if (response.status === 200) {
            resolve(response.data.data);
          } else {
            alert('Something went wrong when fetching a random sentence.');
          }
        });
    });
  }

  highlightSimilarLetters(letter: string, isClue = false) {
    const similarLetters = document.querySelectorAll(
      '#' + (isClue ? 'clue' : 'letter') + '-' + letter
    );
    similarLetters.forEach((similarLetter) => {
      similarLetter.setAttribute('data-isactive', 'true');
    });
  }

  removeHighlightSimilarLetters(letter: string, isClue = false) {
    const similarLetters = document.querySelectorAll(
      '#' + (isClue ? 'clue' : 'letter') + '-' + letter
    );
    similarLetters.forEach((similarLetter) => {
      similarLetter.setAttribute('data-isactive', 'false');
    });
  }

  keyEntered(
    event: KeyboardEvent,
    input: HTMLInputElement,
    word: string | any
  ) {
    // Prevent the normal filling in of the input.
    const NUMBERS = '0123456789';

    if (event.key !== 'Backspace') {
      event.preventDefault();
      if (event.code.includes('Key') && !NUMBERS.includes(event.key)) {
        let currentValue: string | any = input.value;
        if (currentValue.length + 1 <= word.length) {
          input.value += event.key.toLowerCase();
          currentValue = input.value;

          if (word === currentValue) {
            input.disabled = true;
            this.socket.emit('input_completed', word);
          }

          // TODO: Check correctness.
          currentValue = currentValue.split('');
          word = word.split('');

          for (
            let currentValueLetterIndex = 0;
            currentValueLetterIndex <= currentValue.length;
            currentValueLetterIndex++
          ) {
            if (
              currentValue[currentValueLetterIndex] ==
              word[currentValueLetterIndex]
            ) {
              this.sentence.corrected[currentValue[currentValueLetterIndex]] = {
                position:
                  this.sentence?.letter_indices[
                    currentValue[currentValueLetterIndex]
                  ],
                letter: currentValue[currentValueLetterIndex],
              };
            }
          }
        } else {
          if (currentValue.length === word.length && currentValue !== word) {
            input.classList.add('incorrect-input');
            setTimeout(() => {
              input.classList.remove('incorrect-input');
            }, 500);
          }
        }
      }
    }

    this.socket.emit('keydown', this.sentence);
  }
}
