export class inscapH3{validate(v:unknown){return !!v;}process(d:unknown[]){return d.filter(x=>this.validate(x));}}
