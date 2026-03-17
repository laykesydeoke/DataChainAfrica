// accessg component 2
export function accessgComponent2({ data }) {
  const [state, setState] = React.useState(null);
  React.useEffect(() => { setState(data); }, [data]);
  return React.createElement('div', { className: 'accessg-2' },
    React.createElement('h3', null, 'fix: add role-based access guards 2'),
    React.createElement('p', null, JSON.stringify(state))
  );
}
