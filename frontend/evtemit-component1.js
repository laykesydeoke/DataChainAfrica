// evtemit component 1
export function evtemitComponent1({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'evtemit-1' },
    React.createElement('h3', null, 'fix: add event emission tracking 1'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
