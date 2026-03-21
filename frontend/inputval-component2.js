// inputval component 2
export function inputvalComponent2({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'inputval-2' },
    React.createElement('h3', null, 'fix: add input validation helpers 2'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
