// evtemit component 3
export function evtemitComponent3({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'evtemit-3' },
    React.createElement('h3', null, 'fix: add event emission tracking 3'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
