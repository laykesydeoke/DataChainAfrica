// evtemit component 4
export function evtemitComponent4({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'evtemit-4' },
    React.createElement('h3', null, 'fix: add event emission tracking 4'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
