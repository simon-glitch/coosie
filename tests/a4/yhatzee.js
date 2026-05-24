

/**
 * @typedef {Object} roll_for_out
 * @property {boolean[]} rerolls - which dice should be rerolled; for each value, `true` indicates the corresponding die should be rerolled;
 * @property {number} score - the average score;
 */

/** The total number of dice. */
const TS = 6;
const TD = 5;

// Constants for Yahtzee sheet (base on official Hasbro rulebook):
// Upper Section:
/** Aces (Ones) */
const A1 = 0;
/** Twos */
const A2 = 1;
/** Threes */
const A3 = 2;
/** Fours */
const A4 = 3;
/** Fives */
const A5 = 4;
/** Sixes */
const A6 = 5;
// Lower Section:
/** 3 of a kind */
const K3 = 6;
/** 4 of a kind */
const K4 = 7;
/** Full House */
const FH = 8;
/** Small Straight */
const SS = 9;
/** Large Straight */
const LS = 10;
/** YAHTZEE (5 of a kind) */
const YA = 11;
/** Chance */
const CH = 12;

/**
 * Function for n choose k.
 * - i.e. how many ways can you choose k items from n total items.
 * @param {Number} n the number of items to chose from;
 * @param {Number} k the number of items being chosen;
 */
function choose(n, k){
    if(n*k === 0) return 1;
    const m = n - k + 1;
    for(let i = n - 1; i >= m; i--){
        n *= i;
    }
    for(let i = 1; i <= k; i++){
        n /= i;
    }
    return n;
}
/*
Pascal's triangle test. It loses precision at larger values due to the implementation.
function main(mx, my, w){
    for(let y = 0; y < my; y++){
        let r = "";
        for(let x = 0; x < mx; x++){
            let s = "" + choose(x+y, x);
            while(s.length < w) s = " " + s;
            if(s.length > w) s = "*" + s.slice(1, w);
            r += " " + s;
        }
        console.log(r);
    }
}
main(15, 15, 6);
*/

/**
 * Calculate the score of a specific box. This function is just a direct translation of the Yhatzee scoring rules.
 * @param {number[]} dice the currnet face values of the dice;
 * @param {number} box index of which box to roll for;
 * @returns {number} the score;
 */
function d_score(dice, box){
    if(box === A1){
        return dice.reduce((a,b) => a+(b===1));
    }
    if(box === A2){
        return dice.reduce((a,b) => a+(b===2)) * 2;
    }
    if(box === A3){
        return dice.reduce((a,b) => a+(b===3)) * 3;
    }
    if(box === A4){
        return dice.reduce((a,b) => a+(b===4)) * 4;
    }
    if(box === A5){
        return dice.reduce((a,b) => a+(b===5)) * 5;
    }
    if(box === A6){
        return dice.reduce((a,b) => a+(b===6)) * 6;
    }
    if(box === K3 || box === K4 || box === CH){
        return dice.reduce((a,b) => a+b);
    }
    if(box === FH){
        return 25;
    }
    if(box === SS){
        return 30;
    }
    if(box === LS){
        return 40;
    }
    if(box === YA){
        return 50;
    }
}

function g_roll_m(){
    /** @type {number[][]} */
    const m = [];
    for(let y = 0; y < TD; y++){
        m[y] = [];
        for(let x = 0; x < y; x++){
            m[y][x] = 0;
        }
        for(let x = 0; x < TD - y; x++){
            // set to the chance of x successes, given we already have y guaranteed;
            m[y][y + x] = choose(TD - y, x) / TS**x * (1-1/TS)**(TD - y - x);
        }
    }
    return m;
}

/**
 * A matrix used for `roll_c`, represented as an array of columns.
 */
const roll_m = g_roll_m();

/**
 * Figure out chance of getting A dice all with the value B. B is arbitrary.
 * @param {number[]} c the starting chances for [A=0, A=1, A=2, etc.];
 * @param {number} rolls_left how many rolls we have to try to increase the number of dice with the value B;
 * @returns {number[]} the chances for [A=0, A=1, A=2, etc.];
 */
function roll_c(c, rolls_left){
    // multiply c by the matrix roll_m, roll_left times;
    for(let r = 0; r < rolls_left; r++){
        const o = [];
        for(let i = 0; i < TD; i++){
            o[i] = 0;
            for(let j = 0; j < TD; j++){
                o[i] += roll_m[j][i] * c[j]
            }
        }
        c = o;
    }
    return c;
}

/**
 * Figure out the average score when trying to get as many dice as possible the value B and marking the corresponding box for B in the upper section.
 * @param {boolean[]} ai roll_for_out.rerolls; which dice to reroll; this list will be mutated;
 * @param {number[]} dice the currnet face values of the dice;
 * @param {number} b the value B;
 * @param {number} rolls_left how many rolls we have to try to increase the number of dice with the value B;
 * @returns {number} the mean score, accounting for randomness;
 */
function roll_a(ai, dice, b, rolls_left){
    let a = 0;
    dice.forEach((v,i) => {if(v === 1) ai[i] = false, a++;});
    // there are two different `b`s! how confusing!
    return b * roll_c(
        dice.map((v, i) => i === a ? 1 : 0),
        rolls_left
    ).reduce((a,b,i) => a + b * (i+1));
}

/**
 * Count the number of dice that have each value (from 1 to `TS`).
 * @param {Number[]} dice the dice;
 */
function count_v(dice){
    const cv = Array(TS).fill(0);
    dice.forEach(v => cv[v-1]++);
    return cv;
}

/**
 * Roll for the chance box.
 * @param {boolean[]} ai roll_for_out.rerolls; which dice can be rerolled; this list will be mutated;
 * @param {number[]} dice the currnet face values of the dice;
 * @param {number} rolls_left how many rolls we have to try to increase the number of dice with the value B;
 * @returns {number} the mean score, accounting for randomness;
 */
function roll_chance(ai, dice, rolls_left){
    
}

/**
 * Roll for a specific box.
 * @param {number[]} dice the currnet face values of the dice;
 * @param {number} rolls_left how many rolls are left; should be at least 1 otherwise the dice cannot be rerolled;
 * @param {number} box index of which box to roll for;
 * @returns {roll_for_out} which dice should be rerolled;
 */
function roll_for(dice, rolls_left, box){
    const ai = dice.map(() => true);
    let score = 0;
    if(!rolls_left) return {rerolls: ai.map(() => false), score: d_score(dice, box)};
    if(box === A1){
        score = roll_a(ai, dice, 1, rolls_left);
    }
    if(box === A2){
        score = roll_a(ai, dice, 2, rolls_left);
    }
    if(box === A3){
        score = roll_a(ai, dice, 3, rolls_left);
    }
    if(box === A4){
        score = roll_a(ai, dice, 4, rolls_left);
    }
    if(box === A5){
        score = roll_a(ai, dice, 5, rolls_left);
    }
    if(box === A6){
        score = roll_a(ai, dice, 6, rolls_left);
    }
    if(box === K3){
        // while calculating this, we assume the K4, FH, and YA boxes are not available; since the whole point of this function is it only believes in one reality, determined by the box parameter;
        const cv = count_v(dice);
        const m = Math.min(3, cv.reduce((a,b) => Math.max(a,b)));
        const v = cv.reduce((a,b,i) => b >= m ? i : a);
        for(let i = 0, j = 0; i < TD && j < m; i++){
            if(dice[i] !== v) continue;
            ai[i] = false, j++;
        }
        // this needs to figure out the chance we'll actually get a 3 in a row, and have complex logic for when/how to call roll_chance;
        score = roll_chance(dice, ai, rolls_left);
    }
    if(box === K4){
        const cv = count_v(dice);
        const m = Math.min(4, cv.reduce((a,b) => Math.max(a,b)));
        const v = cv.reduce((a,b,i) => b >= m ? i : a);
        for(let i = 0, j = 0; i < TD && j < m; i++){
            if(dice[i] !== v) continue;
            ai[i] = false, j++;
        }
        // this needs to figure out the chance we'll actually get a 4 in a row, and have complex logic for when/how to call roll_chance;
        score = roll_chance(dice, ai, rolls_left);
    }
    if(box === FH){
        
    }
    if(box === SS){
        
    }
    if(box === LS){
        
    }
    if(box === YA){
        
    }
    if(box === CH){
        
    }
    return {rerolls: ai, score};
}


