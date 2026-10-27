import { useState } from 'react';
import { Box, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import VisibilityIconModule from '@mui/icons-material/Visibility';
import VisibilityOffIconModule from '@mui/icons-material/VisibilityOff';
import CheckCircleIconModule from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIconModule from '@mui/icons-material/RadioButtonUnchecked';
import icon from '../utils/icon.js';
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  PASSWORD_SYMBOLS,
  passwordChecks
} from '../utils/passwordPolicy.js';

const VisibilityIcon = icon(VisibilityIconModule);
const VisibilityOffIcon = icon(VisibilityOffIconModule);
const CheckCircleIcon = icon(CheckCircleIconModule);
const RadioButtonUncheckedIcon = icon(RadioButtonUncheckedIconModule);

/**
 * Campo de contraseña con icono de ojo. El clic alterna entre mostrar y ocultar
 * y el estado se mantiene hasta que el usuario vuelva a hacer clic.
 */
export function PasswordField({ InputProps, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
              edge="end"
              // Evita que el botón le quite el foco al campo al hacer clic.
              onMouseDown={event => event.preventDefault()}
              onClick={() => setVisible(current => !current)}
            >
              {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  );
}

const rules = password => {
  const checks = passwordChecks(password);
  return [
    { key: 'length', done: checks.length, label: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres (${[...password].length} escritos)` },
    { key: 'upper', done: checks.upper, label: 'Letras en mayúsculas: A a Z' },
    { key: 'lower', done: checks.lower, label: 'Letras en minúsculas: a a z' },
    { key: 'digit', done: checks.digit, label: 'Números: 0 a 9' },
    { key: 'symbol', done: checks.symbol, label: `Símbolos: ${PASSWORD_SYMBOLS}` },
    { key: 'allowedOnly', done: checks.allowedOnly, label: 'Solo los caracteres anteriores, sin espacios ni acentos' }
  ];
};

/** Lista en vivo de requisitos: cada regla se marca cuando el texto la cumple. */
export function PasswordRequirements({ password }) {
  return (
    <Box aria-live="polite" sx={{ mt: 1 }}>
      <Typography variant="body2" fontWeight={600}>Requisitos de la contraseña</Typography>
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        {rules(password).map(rule => (
          <Stack direction="row" spacing={1} alignItems="center" key={rule.key}>
            {rule.done
              ? <CheckCircleIcon fontSize="small" color="success" />
              : <RadioButtonUncheckedIcon fontSize="small" color="disabled" />}
            <Typography variant="body2" color={rule.done ? 'success.main' : 'text.secondary'}
              sx={{ fontFamily: rule.key === 'symbol' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
              {rule.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
