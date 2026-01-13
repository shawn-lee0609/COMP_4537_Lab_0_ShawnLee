// Name : Shawn Lee
// Set : G
// Student Number : A01417475

// AI Disclosure: This assignment was completed with assistance from Claude AI (Anthropic)
// for learning css and JavaScript to understand concepts and code structure.

// js/script.js
import { MESSAGES } from '../lang/messages/en/user.js';

class GameButton {
    constructor(order, color) {
        this.order = order;              // Button number (1, 2, 3...)
        this.color = color;              // Background color
        this.originalTop = 0;            // Starting Y position
        this.originalLeft = 0;           // Starting X position
        this.element = null;             // The button is not made yet, will be created
                                         // by "createButton()"
        this.isRevealed = false;         // Has number been shown?

        this.createButton();
    }

    createButton() {
        // elements is an object which has attributes and methods
        this.element = document.createElement('button'); // Creates the actual button for line 7
        this.element.className = 'game-button';
        this.element.style.backgroundColor = this.color;
        this.element.style.position = 'absolute'; // Makes it able to be overlapped with other elements (btns)
        this.element.textContent = this.order;
    }

    // Set the initial position 
    setPosition(top, left) {
        this.element.style.top = `${top}px`; // Using back tick
        this.element.style.left = `${left}px`;
    }

    setOriginalPosition(top, left) {
        this.originalTop = top;
        this.originalLeft = left;
        this.setPosition(top, left);
    }

    hideNumber() {
        this.element.textContent = ''; // Empty string = no number shows up on the btn
        // Do not need "this.isrevealed = false" because hideNumber only gets called when 
        // the game starts, therfore no need to set up to false again
    }

    revealNumber() {
        this.element.textContent = this.order;  // Show the number again
        this.isRevealed = true;
    }

    // Makes the button respond to clicks (used after scrambling)
    makeClickable(clickHandler) {
        this.element.classList.add('clickable'); // Adds CSS class(clickable function) to html element
        this.element.addEventListener('click', clickHandler);
    }

    removeFromDOM() {
        // if there is no parentnode then we don't need to try removing it at the first place
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    // Appending the button so that it shows on the actual screen
    appendTo(container) {
        container.appendChild(this.element);
    }
}

// Calculates where buttons should go on the screen
class ButtonPositionManager {
    constructor(gameArea) {
        this.gameArea = gameArea;
        this.buttonWidth = 100;
        this.buttonHeight = 50;
    }

    getRandomPosition() {
        // Fetches the actual size of the game area
        const rect = this.gameArea.getBoundingClientRect();
        // To give extra room for the buttons I chose 20
        // Therefore the buttons are placed within the area
        const maxTop = rect.height - this.buttonHeight - 20;
        const maxLeft = rect.width - this.buttonWidth - 20;
        
        const top = Math.floor(Math.random() * maxTop);
        const left = Math.floor(Math.random() * maxLeft);
        
        return { top, left };
    }

    // To allign the buttons linearly on the screen when the game initially starts
    // Use parameter "count" for how many buttons would show up
    calculateInitialPositions(count) {
        const positions = [];
        const spacing = 10;
        let currentLeft = 20;

        for (let i = 0; i < count; i++) {
            positions.push({
                top: 50,
                left: currentLeft
            });
            // Makes it start from the previous button location
            currentLeft += this.buttonWidth + spacing;
        }

        return positions;
    }
}

// Class to generate random colors
class ColorGenerator {
    static getRandomColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.getRandomColor());
        }
        return colors;
    }

    static getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }
}


// Class to validate user input
class InputValidator {
    static validateButtonCount(value) {
        const num = parseInt(value);
        if (isNaN(num) || num < 3 || num > 7) {
            return { valid: false, message: MESSAGES.ERROR_INVALID_NUMBER };
        }
        return { valid: true, value: num };
    }
}

// Class to manage the game state and logic
class GameEngine {
    constructor(buttonCount, gameArea) {
        this.buttonCount = buttonCount;
        this.gameArea = gameArea;
        this.buttons = [];
        this.positionManager = new ButtonPositionManager(gameArea);
        this.clickedOrder = [];
        this.isGameActive = false;
        this.scrambleCount = 0;
        // Follow the game condition
        this.maxScrambles = buttonCount;
        
        this.initializeButtons();
    }

    initializeButtons() {
        const colors = ColorGenerator.getRandomColors(this.buttonCount);
        // Set up the initial positions for the buttons
        const positions = this.positionManager.calculateInitialPositions(this.buttonCount);

        for (let i = 0; i < this.buttonCount; i++) {
            // Defines the Order and the Color of each button 
            const button = new GameButton(i + 1, colors[i]);
            // Fetch the position from the predefined position array 
            button.setOriginalPosition(positions[i].top, positions[i].left);
            button.appendTo(this.gameArea);
            this.buttons.push(button);
        }
    }

    startScrambling() {
        return new Promise((resolve) => {
            // Pauses based on the number of buttons
            // This gives users time to memorize the button order
            const pauseDuration = this.buttonCount * 1000;
            
            // Wait for pauseDuration, then start scrambling
            // The Promise stays pending until resolve() is called
            setTimeout(() => {
                this.scrambleButtons(resolve);
            }, pauseDuration);
        });
    }

    // callback - Function to call when scrambling is complete (resolve)
    scrambleButtons(callback) {
        // Track how many times we've scrambled
        let currentScramble = 0;
        
        // Set up interval to scramble every 2 seconds
        // Therefore setInterval() allows the function to run 
        // based on the assigned time without needing iteration
        const scrambleInterval = setInterval(() => {
            // Move each button to a random position
            this.buttons.forEach(button => {
                const { top, left } = this.positionManager.getRandomPosition();
                button.setPosition(top, left);
            });

            currentScramble++;
            this.scrambleCount = currentScramble;

            // After finishing the whole scambling process it calls resolve() 
            // so that startScrambling() knows the task finished
            if (currentScramble >= this.maxScrambles) {
                // Stop the interval timer
                clearInterval(scrambleInterval);
                // Hide numbers and make buttons clickable
                this.prepareForUserInput();
                // Signal that scrambling is complete (resolves the Promise)
                callback(); // Calls resolve() which indicates the task had finished and to complete the Promise
            }
        }, 2000); // Execute every 2 seconds until maxScrambles is reached
    }

    prepareForUserInput() {
        this.buttons.forEach(button => {
            button.hideNumber();
            // Whenever it clicks it calls the handleButtonClick()
            button.makeClickable(() => this.handleButtonClick(button));
        });
        this.isGameActive = true;
    }

    /**
     * GAME LOGIC:
     * - Buttons are assigned sequential numbers (order) at creation: 1, 2, 3, 4
     * - These order values are permanent and never change
     * - After scrambling, positions change but order values remain the same
     * - When clicked, the order values are collected into an array
     * - The array is validated to ensure buttons were clicked in correct sequence [1, 2, 3, 4]
     */
    handleButtonClick(clickedButton) {
        if (!this.isGameActive || clickedButton.isRevealed) {
            return;
        }

        clickedButton.revealNumber(); // When the button is clicked it reveals the number

        // Record which button was clicked (stores the button's actual number: 1, 2, 3, or 4)
        this.clickedOrder.push(clickedButton.order); 

        // Calculate which button should have been clicked at this position
        // Array length represents how many clicks have been made so far
        // For example: if length is 3, this is the 3rd click, so button 3 should have been clicked
        const expectedOrder = this.clickedOrder.length; 
        
        // When the user guessed it wrongly
        // The nth click should be button number n
        if (clickedButton.order !== expectedOrder) {
            this.endGame(false);
            return;
        }

        // When the user guessed the order correctly
        if (this.clickedOrder.length === this.buttonCount) {
            this.endGame(true);
        }
    }

    endGame(success) {
        this.isGameActive = false;
        
        this.buttons.forEach(button => {
            button.revealNumber();
        });

        const message = success ? MESSAGES.SUCCESS_EXCELLENT : MESSAGES.ERROR_WRONG_ORDER;
        return { success, message };
    }

    cleanup() {
        this.buttons.forEach(button => button.removeFromDOM());
        // Initialize the array
        this.buttons = [];
    }
}

// Class to manage UI interactions and display
class UserInterface {
    constructor() {
        this.promptLabel = document.getElementById('prompt-label');
        this.input = document.getElementById('button-count-input');
        this.goButton = document.getElementById('go-button');
        this.gameArea = document.getElementById('game-area');
        this.messageDisplay = document.getElementById('message-display');
        
        this.initializeText();
    }

    initializeText() {
        this.promptLabel.textContent = MESSAGES.PROMPT_BUTTON_COUNT;
        this.goButton.textContent = MESSAGES.BUTTON_GO;
    }

    getButtonCount() {
        return this.input.value;
    }

    showMessage(message, isError = false) {
        this.messageDisplay.textContent = message;
        this.messageDisplay.className = isError ? 'error' : 'success';
    }

    clearMessage() {
        this.messageDisplay.textContent = '';
        this.messageDisplay.className = '';
    }

    clearGameArea() {
        this.gameArea.innerHTML = '';
    }

    disableInput() {
        this.input.disabled = true;
        this.goButton.disabled = true;
    }

    enableInput() {
        this.input.disabled = false;
        this.goButton.disabled = false;
    }
}

/**
 * Main application controller class
 */
class MemoryGameApp {
    constructor() {
        this.ui = new UserInterface();
        this.currentGame = null;
        
        this.setupEventListeners();
    }

    // Detects the user's input (start button)
    setupEventListeners() {
        // Start by clicking the "Go" button
        this.ui.goButton.addEventListener('click', () => this.startNewGame());

        // Also starts by pressing the "Enter" key
        this.ui.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startNewGame();
            }
        });
    }

    // By saying "aync" it implies in this function there will be "await"
    async startNewGame() {
        // First validate whether the user inputted valid number of buttons
        const validation = InputValidator.validateButtonCount(this.ui.getButtonCount());
        
        if (!validation.valid) {
            this.ui.showMessage(validation.message, true);
            return;
        }

        // Sets the UI
        this.ui.clearMessage();
        this.ui.disableInput();
        
        // Clean up the previous game
        if (this.currentGame) {
            this.currentGame.cleanup();
        }
        
        this.ui.clearGameArea();
        
        // Number of Buttons and Game Area to start the game
        this.currentGame = new GameEngine(validation.value, this.ui.gameArea);
        
        // Waits for this task to be finished (Scrambling the buttons)
        // Related to the Promise from startScrambling()
        await this.currentGame.startScrambling();
        
        this.waitForGameEnd();
    }

    // Continiously checking whether the game is finished or not (every 0.1 sec)
    waitForGameEnd() {
        const checkInterval = setInterval(() => {
            if (!this.currentGame.isGameActive && this.currentGame.clickedOrder.length > 0) {
                clearInterval(checkInterval);
                // Judge whether win or lose
                const result = this.currentGame.endGame(
                    this.currentGame.clickedOrder.length === this.currentGame.buttonCount
                );
                this.ui.showMessage(result.message, !result.success);
                // Able to start a new game
                this.ui.enableInput();
            }
        }, 100);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MemoryGameApp();
});