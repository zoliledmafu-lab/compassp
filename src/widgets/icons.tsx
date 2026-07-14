import React from 'react'
import {
  Grid3X3, BarChart2, TrendingUp, Activity,
  Waves, Target, Zap, FlaskConical, Table2,
  Grid2X2, Network, Scale, Layers, FileText,
  Clock, CloudRain, Hash, TableProperties,
  Brain, Users, BookOpen, Leaf, Triangle,
  Utensils, LineChart,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  'coordinate-plane':       <Grid3X3 size={14} />,
  'statistics-chart':       <BarChart2 size={14} />,
  'quadratic-graph':        <TrendingUp size={14} />,
  'trig-graph':             <Activity size={14} />,
  'physics-wave':           <Waves size={14} />,
  'physics-projectile':     <Target size={14} />,
  'physics-forces':         <Zap size={14} />,
  'chemistry-titration':    <FlaskConical size={14} />,
  'chemistry-periodic':     <Table2 size={14} />,
  'biology-punnett':        <Grid2X2 size={14} />,
  'biology-foodweb':        <Network size={14} />,
  'economics-supplydemand': <LineChart size={14} />,
  'accounting-taccount':    <Scale size={14} />,
  'business-swot':          <Layers size={14} />,
  'english-essay-planner':  <FileText size={14} />,
  'history-timeline':       <Clock size={14} />,
  'geography-climate':      <CloudRain size={14} />,
  'cs-binary-converter':    <Hash size={14} />,
  'cs-trace-table':         <TableProperties size={14} />,
  'psych-study':            <Brain size={14} />,
  'law-irac':               <Scale size={14} />,
  'sociology-perspectives': <Users size={14} />,
  'languages-vocab':        <BookOpen size={14} />,
  'agriculture-crop-planner': <Leaf size={14} />,
  'env-eco-data':           <Leaf size={14} />,
  'techgraphics-shapes':    <Triangle size={14} />,
  'foodnutrition-planner':  <Utensils size={14} />,
}

export function getWidgetIcon(widgetId: string): React.ReactNode {
  return ICON_MAP[widgetId] ?? <BarChart2 size={14} />
}
