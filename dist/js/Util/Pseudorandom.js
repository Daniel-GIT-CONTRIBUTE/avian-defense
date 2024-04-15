export class Pseudorandom {
	constructor() {
		this.m = 155556;
		this.a = 70401;
		this.c = 38881;

		this.seed = this.m/2;
	}

	lcg(start, end) {
		this.seed = (this.a * this.seed + this.c) % this.m;
		let output = ((this.seed/this.m) * (end-start)) + start;
		this.seed = Math.random()*1000; 
		return output;
	}

}