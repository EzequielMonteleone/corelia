'use client';

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {
  HouseholdMember,
  HouseholdMemberInput,
  HouseholdRelation,
  Pet,
  PetInput,
  PetSpecies,
  Vehicle,
  VehicleInput,
} from '@/types/household';

const RELATIONS: HouseholdRelation[] = ['SPOUSE', 'CHILD', 'PARENT', 'OTHER'];
const SPECIES: PetSpecies[] = ['DOG', 'CAT', 'OTHER'];

const fieldClass = 'space-y-1.5';
const labelClass = 'text-xs font-medium text-gray-400';
const notesClass =
  'flex min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-blue-500/50 focus:outline-none';

function FormActions({
  pending,
  onCancel,
}: {
  pending: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations('Household');
  const tCommon = useTranslations('Common');
  return (
    <div className="flex justify-end gap-3 sm:col-span-2">
      <Button type="button" intent="ghost" onClick={onCancel} disabled={pending}>
        {tCommon('cancel')}
      </Button>
      <Button type="submit" isLoading={pending}>
        {t('save')}
      </Button>
    </div>
  );
}

export function MemberForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: HouseholdMember | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: HouseholdMemberInput) => void;
}) {
  const t = useTranslations('Household');
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [relation, setRelation] = useState<HouseholdRelation>(initial?.relation ?? 'OTHER');
  const [documentNumber, setDocumentNumber] = useState(initial?.documentNumber ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      firstName,
      lastName,
      relation,
      ...(documentNumber.trim() ? {documentNumber: documentNumber.trim()} : {}),
      ...(phone.trim() ? {phone: phone.trim()} : {}),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className={fieldClass}>
        <span className={labelClass}>{t('firstName')}</span>
        <Input value={firstName} onChange={event => setFirstName(event.target.value)} required />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('lastName')}</span>
        <Input value={lastName} onChange={event => setLastName(event.target.value)} required />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('relation')}</span>
        <Select value={relation} onChange={event => setRelation(event.target.value as HouseholdRelation)}>
          {RELATIONS.map(item => (
            <option key={item} value={item}>
              {t(`relations.${item}`)}
            </option>
          ))}
        </Select>
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('documentNumber')}</span>
        <Input
          value={documentNumber}
          onChange={event => setDocumentNumber(event.target.value)}
        />
      </label>
      <label className={`${fieldClass} sm:col-span-2`}>
        <span className={labelClass}>{t('phone')}</span>
        <Input value={phone} onChange={event => setPhone(event.target.value)} />
      </label>
      <FormActions pending={pending} onCancel={onCancel} />
    </form>
  );
}

export function VehicleForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Vehicle | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: VehicleInput) => void;
}) {
  const t = useTranslations('Household');
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [color, setColor] = useState(initial?.color ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      plate,
      ...(make.trim() ? {make: make.trim()} : {}),
      ...(model.trim() ? {model: model.trim()} : {}),
      ...(color.trim() ? {color: color.trim()} : {}),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className={fieldClass}>
        <span className={labelClass}>{t('plate')}</span>
        <Input value={plate} onChange={event => setPlate(event.target.value)} required />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('make')}</span>
        <Input value={make} onChange={event => setMake(event.target.value)} />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('model')}</span>
        <Input value={model} onChange={event => setModel(event.target.value)} />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('color')}</span>
        <Input value={color} onChange={event => setColor(event.target.value)} />
      </label>
      <FormActions pending={pending} onCancel={onCancel} />
    </form>
  );
}

export function PetForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Pet | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: PetInput) => void;
}) {
  const t = useTranslations('Household');
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(initial?.species ?? 'DOG');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      name,
      species,
      ...(notes.trim() ? {notes: notes.trim()} : {}),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <label className={fieldClass}>
        <span className={labelClass}>{t('petName')}</span>
        <Input value={name} onChange={event => setName(event.target.value)} required />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>{t('speciesLabel')}</span>
        <Select value={species} onChange={event => setSpecies(event.target.value as PetSpecies)}>
          {SPECIES.map(item => (
            <option key={item} value={item}>
              {t(`species.${item}`)}
            </option>
          ))}
        </Select>
      </label>
      <label className={`${fieldClass} sm:col-span-2`}>
        <span className={labelClass}>{t('notes')}</span>
        <textarea
          className={notesClass}
          value={notes}
          onChange={event => setNotes(event.target.value)}
        />
      </label>
      <FormActions pending={pending} onCancel={onCancel} />
    </form>
  );
}
