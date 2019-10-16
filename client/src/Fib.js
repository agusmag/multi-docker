import React, { Component } from 'react';
import axios from 'axios';

class Fib extends Component {
	state = {
		seenIndexes: [],
		values: {},
		index: ''
	};

	componentDidMount() {
		this.fetchValues();
		this.fetchIndexes();
	}

	//Get from backend the searched values stored in the postgres db.
	async fetchValues() {
		const values = await axios.get('/api/values/current');
		this.setState({ values: values.data });
	}

	//Get from backend the indexes and values stored in the redis db.
	async fetchIndexes(){
		const seenIndexes = await axios.get('/api/values/all');
		this.setState({
			seenIndexes: seenIndexes.data
		});
	}


	handleSubmit = async ( event ) => {
		event.preventDefault();

		await axios.post('/api/values', {
			index: this.state.index
		});

		this.setState({ index: '' });
	}

	renderSeenIndexes() {
		return this.state.seenIndexes.map(({ number }) => number).join(', '); //Iterate the array of numbers and return the numbers and join it with a , .
	}

	renderValues(){
		const entries = [];

		for (let key in this.state.values ) {
			entries.push(
				<div key={key}>
					For Index {key} I calculated { this.state.values[key]}
				</div>
			);
		}

		return entries;
	}

	render(){
		return (
			<div>
				<form onSubmit={ this.handleSubmit }>
					<label>Enter your index:</label>
					<input 
						value={this.state.index}
						onChange={event => this.setState({ index: event.target.value })}
					/>
					<button>Submit</button>
				</form>

				<h3>Indexes I have seen:</h3>
				{ this.renderSeenIndexes() }

				<h3>Calculated Values:</h3>
				{ this.renderValues() }
			</div>
		)
	}
}

export default Fib;