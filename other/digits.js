
// Goal: Find all x, such that x / product of (x's digits) = n.

function choose_float(n, k){
    // n choose k = (n!) / ((n - k)! * k!)
    // we can separate these out
    // so prod from (n - k + 1) to (n)
    // then divide out k!, by dividing those individual terms
    // this guarantees maximum accuracy, and works with BigInts!
    let product = 1;
    let k_divs_left = k;
    // each step is completely independent,
    // so this can be parallelized a lot if you really wanted to;
    for(let i = n - k + 1; i <= n; i++){
        let factor = i;
        if(k_divs_left){
            // make 0, k, 2*k -> k, instead of 0;
            const rem = ((factor + k - 1) % k) + 1;
            factor /= rem;
        }
        product *= factor;
    }
    return product;
}

function choose_bigint(n, k){
    let product = 1n;
    let k_divs_left = k;
    for(let i = n - k + 1n; i <= n; i++){
        let factor = i;
        if(k_divs_left){
            const rem = ((factor + k - 1n) % k) + 1n;
            factor /= rem;
        }
        product *= factor;
    }
    return product;
}

// for reference, check how much work choose_with_reps_iter is doing;
function choose_with_reps(n, k){
    if(typeof n === "bigint" || typeof k === "bigint"){
        return choose_bigint(
            BigInt(n + k - 1n), BigInt(k)
        );
    }
    return choose_float(n + k - 1, k);
}

/** n is the number of types of things to choose from, k is the number of things to choose. This generator yields list of indices (from 0 to n-1). [0,0,0,2,5], [0,0,2,2,6], and [0,1,1,1,1] could be yielded from choose_with_reps_iter(7, 5) for example. */
function* choose_with_reps_iter(n, k){
    const using = [];
    for(let i = 0; i < k; i++){
        using[i] = 0;
    }
    let j = k - 1;
    
    while(using[k - 1] < n){
        yield using.slice();
        // carry over; i.e. stop decrementing the last item in using, and decrement the item before it instead;
        while(j > 0 && using[j] === n - 1){
            j--;
        }
        using[j]++;
        while(j < k - 1){
            using[j + 1] = using[j];
            j++;
        }
    }
}

/** A weighted version choose_with_reps_iter. Each index has a corresponding weight, and the sum of the weights cannot be outside the range from min to max, inclusive of both values. Also this returns the values in descending order, since that is more optimal for find_bi below. min_w is the weights rounded up, and max_w is the weights rounded down, to make sure we cover everything. */
function* choose_with_reps_iter_weighted(n, k, min_w, max_w, min, max){
    const using = [];
    for(let i = 0; i < k; i++){
        using[i] = n - 1;
    }
    // const l_min = min_w[n - 1];
    const l_max = max_w[0];
    const i_min = [0];
    const i_max = [0];
    let j = k - 1;
    
    // max init handling
    let ma = 0;
    let mp = n;
    for(let mj = 0; mj < k; mj++){
        const mr = max_w[0] * (k - mj);
        let ms = 0;
        let mi = ma + max_w[ms] + mr;
        while(ms <= mp && mi <= max){
            ms++;
            mi = ma + max_w[ms] + mr;
        }
        ms--;
        mp = ms;
        using[mj] = ms;
        ma += max_w[ms];
    }
    // update i_min/i_max
    for(let i = 1; i < k; i++){
        i_min[i] = min_w[using[i-1]] + i_min[i-1];
        i_max[i] = max_w[using[i-1]] + i_max[i-1];
    }
    
    // i hope you like confusing code, because this is my probably my most confusing code yet;
    while(using[k - 1] >= 0){
        // if the current value is making us overshoot max, then just continue to the next value;
        while(
            /*
            say the current number is n
            score = previous weights + weight for n + weights if all following numbers are also 1
            */
            // console.log("max check", {j, i_max, max_w, using, l_max, mul: (k - 1 - j), max, expr: using[j] >= 0 && i_max[j] + max_w[using[j]] + max_w[0] * (k - 1 - j) > max,}),
            using[j] >= 0 && i_max[j] + max_w[using[j]] + max_w[0] * (k - 1 - j) > max
        ){
            using[j]--;
            // console.log("trying to follow max");
        }
        if(using[j] >= 0){
            // console.log("using", using);
            yield using.slice();
        }
        // carry over; i.e. stop decrementing the last item in using, and decrement the item before it instead;
        while(j > 0 && using[j] <= 0){
            j--;
        }
        // this is important!
        using[j]--;
        // if we can't reach min even at the highest value possible, carry over;
        while(
            /*
            say the current number is n
            score = previous weights + weight for n + weights if all following numbers are also n
            score = previous weights + weight for n * (number of places in using left, including the current place)
            */
            // console.log("min check", {j, i_min: i_min.slice(), min_w, using: using.slice(), mul: (k - 1 - j), min, exp: j > 0 && i_min[j] + min_w[using[j]] * (k - j) < min,}),
            j > 0 && i_min[j] + min_w[using[j]] * (k - j) < min
        ){
            // console.log("trying to follow min");
            j--;
            // this is important!
            using[j]--;
        }
        // console.log("j where are you???", j);
        // extra check to see if we're done;
        if(j === 0 && min_w[using[j]] * k < min){
            break;
        }
        // ensure the list is in descending order by initializing values;
        while(j < k - 1){
            using[j + 1] = using[j];
            i_min[j + 1] = i_min[j] + min_w[using[j]];
            i_max[j + 1] = i_max[j] + max_w[using[j]];
            j++;
        }
        // we need to setup min/max for that last value;
        i_min[j] = i_min[j - 1] + min_w[using[j - 1]];
        i_max[j] = i_max[j - 1] + max_w[using[j - 1]];
    }
}
/*
const cn = 15, ck = 15;
const cwr = [...choose_with_reps_iter_weighted(
    cn, ck, [0,1,2,3,4,5,6,7], [0,1,2,3,4,5,6,7], 6, 6,
)];
console.log(`Kept ${cwr.length} / ${choose_with_reps(cn, ck)}: ${cwr.map(v => v.join(""))}.`);
*/


/** Find k such that x <= 10^k. */
function k_pow(n){
    return Math.log(n)/Math.log(10/9);
}

/** Find all x, such that x / product of (x's digits) = n. */
function find(n){
    const res = new Set();
    function check(p0){
        const x = n * p0;
        // check if the digits actually match;
        const p1 = (""+x).split("").reduce((a,b) => a*b, 1);
        /* This also works and seems to have the same performance.
        let temp = x;
        let p1 = 1;
        while(temp > 0){
            p1 *= temp % 10;
            temp = Math.floor(temp / 10);
        }
        */
        if(p0 === p1) res.add(x);
    }
    const k = Math.ceil(k_pow(n));
    for(let ik = 1; ik < k; ik++){
        // we have 5 usable digits: 5,6,7,8,9;
        const it = choose_with_reps_iter(5, ik);
        for(const i of it){
            // calculate what x would need to be;
            const p0 = i.reduce((a,b) => a*(b+5), 1);
            check(p0);
            const o8 = i.reduce((a,b) => a || b==3, false);
            const o9 = i.reduce((a,b) => a || b==4, false);
            if(o8) check(p0/2), check(p0/4);
            if(o9) check(p0/3);
            if(o8 && o9) check(p0/6), check(p0/12);
        };
    }
    const o = [...res];
    o.sort((a,b) => a-b);
    return o;
}

const l_mul = 256;
function ld(xs){
    return xs.map(x => (Math.floor(Math.log10(x) * l_mul) / l_mul));
}
function lu(xs){
    return xs.map(x => (Math.ceil(Math.log10(x) * l_mul) / l_mul));
}

const max_t = 100;
const bi1 = [5n,7n,9n];
const bi1_min = ld([5,7,9]);
const bi1_max = lu([5,7,9]);
const bi2 = [7n,8n,9n];
const bi2_min = ld([7,8,9]);
const bi2_max = lu([7,8,9]);
/** Find all x, such that x / product of (x's digits) = n. */
function* find_bi(n){
    const tfreq = 100;
    let ti = 0;
    let tj = 0;
    let t0 = performance.now(), t1 = performance.now();
    const log_n = Math.log10(Number(n));
    const log_left = -1 - log_n;
    const log_right1 = Math.log10(3);
    const log_right2 = Math.log10(36);
    n = BigInt(n);
    const res = new Set();
    function check(p0){
        const x = n * p0;
        // check if the digits actually match;
        // const p1 = (""+x).split("").reduce((a,b) => a*BigInt(b), 1n);
        // This has much better performance.
        let temp = x;
        let p1 = 1n;
        while(temp){
            const d = temp % 10n;
            if(!d) return;
            p1 *= d;
            temp /= 10n;
        }
        if(p0 === p1) res.add(x);
    }
    const k = Math.ceil(k_pow(Number(n)));
    for(let ik = 1; ik < k; ik++){
        /*
        we have 4 usable digits: 5,7,8,9;
        we need k-1 <= log(digits) + log(n) <= k + log(36);
        i.e. log(digits) is between (k-1 - log(n)) and (k + log(36) - log(n))
        however, 5 and 8 cannot exist together, since 2*5=10, and the 0 would require the product to be 0;
        */
        // first, 5,7,9;
        const it1 = choose_with_reps_iter_weighted(
            3, ik,
            bi1_min, bi1_max,
            ik + log_left, ik + log_right1,
        );
        for(const i of it1){
            ti++;
            if(ti === tfreq){
                ti = 0;
                t1 = performance.now();
                if(t1 - t0 > max_t){
                    tj++;
                    yield tj;
                    t0 = performance.now();
                }
            }
            const p0 = i.reduce((a,b) => a*bi1[b], 1n);
            check(p0);
            const o9 = i.lastIndexOf(2) > -1;
            if(o9) check(p0/3n);
        };
        // second, 7,8,9;
        const it2 = choose_with_reps_iter_weighted(
            3, ik,
            bi2_min, bi2_max,
            ik + log_left, ik + log_right2,
        );
        for(const i of it2){
            ti++;
            if(ti === tfreq){
                ti = 0;
                t1 = performance.now();
                if(t1 - t0 > max_t){
                    tj++;
                    yield tj;
                    t0 = performance.now();
                }
            }
            // calculate what x would need to be;
            const p0 = i.reduce((a,b) => a*bi2[b], 1n);
            check(p0);
            // handle all of the factors of 72; this is why we don't have 2,3,4,6 in the digit list above;
            const o8 = i.lastIndexOf(1) > -1;
            const o9 = i.lastIndexOf(2) > -1;
            if(o8) check(p0/2n), check(p0/4n);
            if(o9) check(p0/3n);
            if(o8 && o9) check(p0/6n), check(p0/8n), check(p0/9n), check(p0/12n), check(p0/18n), check(p0/24n), check(p0/36n);
        };
    }
    const o = [...res];
    // bigint sorting, since results could exceed 2**53;
    o.sort((a,b) => (a<b ? -1 : a>b ? 1 : 0));
    console.log("result: "+o);
    return ""+o;
}

let find_n = 2;
let find_max = 333;
let find_it = find_bi(find_n);
let fid = -1;
if(1) onclick = function(){
if(fid === -1)
fid = setInterval(function(){
    const res = find_it.next();
    if(res.done){
        output.innerHTML += (
            find_n +
            "&Tab;" +
            res.value.replace(/,/g, "&Tab;") +
            "<br>"
        );
        find_n++;
        if(find_n > find_max){
            clearInterval(fid);
            return;
        }
        find_it = find_bi(find_n);
    }
    else{
        // wait I guess;
        // console.log(res.value);
    }
}, max_t*2);
};




