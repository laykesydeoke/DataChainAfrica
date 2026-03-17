// evtemit component 2
export function evtemitComponent2({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'evtemit-2' },
    React.createElement('h3', null, 'fix: add event emission tracking 2'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
