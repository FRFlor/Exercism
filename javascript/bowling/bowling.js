
const MAX_PIN_COUNT = 10;   // Number of pins in at the start of a session
const BASE_ROLLS_COUNT = 2; // Minimum amount of rolls each frame is guaranteed to have
const STRIKE_ROLL_BONUS = 2; // How many bonus rolls a frame gets for containing a strike
const SPARE_ROLL_BONUS = 1;  // How many bonus rolls a frame gets for containing a spare

class Bowling {
    constructor() {

        // Student Note: This is the same as push(new Frame()) happening 10 times on an empty array.
        this.frames = Array.from({length: MAX_PIN_COUNT}).map(_ => new Frame());
    }

    score() {

        if (!this.allFramesAreComplete()) {
            throw new Error('Score cannot be taken until the end of the game');
        }

        // Student Note: .reduce((total, part) => { ... }, initialValue);
        return this.frames.reduce((totalScore, currentFrame) => {
            return totalScore + currentFrame.score()
        }, 0);
    }

    roll(rollValue) {

        if (this.allFramesAreComplete()) {
            throw new Error('Cannot roll after game is over');
        }

        let newRoll = new Roll(rollValue);

        for (let frameIndex = 0; frameIndex < this.frames.length; frameIndex++) {
            if (this.isPreviousFrameStillInBaseRolls(frameIndex)) {

                return;
            }
            this.frames[frameIndex].tryInsertNewRoll(newRoll);
        }
    }

    allFramesAreComplete() {

        return (this.frames.find(frame => frame.isInProgress()) === undefined);
    }

    isPreviousFrameStillInBaseRolls(currentFrameIndex) {
        return currentFrameIndex !== 0 && this.frames[currentFrameIndex - 1].awaitsBaseRolls();
    }

}



class Roll {
    constructor(rollValue) {

        if (rollValue < 0) {
            throw new Error('Negative roll is invalid');
        }


        if (rollValue > MAX_PIN_COUNT) {
            throw new Error('Pin count exceeds pins on the lane');
        }

        this.value = rollValue;
        this.isBaseRoll = true;
    }

    isBonusRoll() {
        return !this.isBaseRoll;
    }

    isStrike() {
        return this.value === MAX_PIN_COUNT;
    }

    makesSpareWith(previousRoll) {
        return this.value !== 0 && this.value + previousRoll.value === MAX_PIN_COUNT;
    }
}



class Frame {
    constructor() {

        this.rolls = [];
        this.remainingRolls = BASE_ROLLS_COUNT; // A frame by default may only have 2 rolls on it. This value may change if strike/spare happens
        this.previousRoll = null;
    }

    cannotReceiveRoll(newRoll) {

        return (this.isComplete() ||
            (this.awaitsBaseRolls() && newRoll.isBonusRoll()));
    }

    tryInsertNewRoll(newRoll) {

        if (this.cannotReceiveRoll(newRoll)) {
            return;
        }

        // Okay! Time to add the roll to this frame;
        this.remainingRolls--;

        switch (this.rolls.length) {
            case 0:
                this.insertFirstRoll(newRoll);
                break;
            case 1:
                this.insertSecondRoll(newRoll);
                break;
            case 2:
            case 3:
                this.insertBonusRoll(newRoll);
                break;
            default:
                throw new Error('CUSTOM: This frame contains more rolls than possible!');
        }

    }

    isEmpty() {
        return this.rolls.length === 0;
    }

    isComplete() {
        return this.remainingRolls === 0;
    }

    isInProgress() {
        return !this.isComplete();
    }

    hasFinishedBaseRolls() {
        return this.rolls.length >= BASE_ROLLS_COUNT;
    }

    awaitsBaseRolls() {
        return !this.hasFinishedBaseRolls();
    }

    insertFirstRoll(newRoll) {

        newRoll.isBaseRoll = false;
        this.previousRoll = newRoll;
        this.rolls.push(newRoll);

        if (newRoll.isStrike()) {
            this.remainingRolls += STRIKE_ROLL_BONUS; // Strikes add 2 bonus rolls

            this.tryInsertNewRoll(new Roll(0)); // The second 'real throw' is empty
        }
    }

    insertSecondRoll(newRoll) {

        if (newRoll.makesSpareWith(this.previousRoll)) {
            this.remainingRolls += SPARE_ROLL_BONUS; // Spares adds a new roll
        }

        if (this.isInvalidAdditionalRoll(newRoll)) {
            throw new Error('Pin count exceeds pins on the lane');
        }


        newRoll.isBaseRoll = false;
        this.previousRoll = newRoll;
        this.rolls.push(newRoll);
    }

    insertBonusRoll(newRoll) {

        if (this.isInvalidAdditionalRoll(newRoll)) {
            throw new Error('Pin count exceeds pins on the lane');
        }

        this.previousRoll = newRoll;
        this.rolls.push(newRoll);
    }

    isInvalidAdditionalRoll(newRoll) {

        return (this.rolls.length % 2 !== 0 &&   // This roll is the last of the pair (A frame may have up to 2 pairs)
            !this.previousRoll.isStrike() &&
            newRoll.value + this.previousRoll.value > MAX_PIN_COUNT); // The sum of the rolls exceeds the total number of pins
    }

    score() {

        return this.rolls.reduce((totalFrameScore, currentRoll) => {
            return totalFrameScore + currentRoll.value;
        }, 0);
    }
}


module.exports = Bowling;