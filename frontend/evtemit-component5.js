// evtemit component 5
export function evtemitComponent5({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'evtemit-5' },
    React.createElement('h3', null, 'fix: add event emission tracking 5'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
