# programs/serializers.py - Versión final con contenido integrado

from rest_framework import serializers
from .models import TreatmentProgram, UserProgram

class TreatmentProgramSerializer(serializers.ModelSerializer):
    """Serializer para detalles del programa de tratamiento"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = TreatmentProgram
        fields = [
            'id', 'name', 'type', 'type_display', 'description',
            'color_primary', 'color_secondary'
        ]

class UserProgramSerializer(serializers.ModelSerializer):
    """Serializer mejorado que incluye todo el contenido estructurado"""
    program = TreatmentProgramSerializer(read_only=True)
    profile_data = serializers.SerializerMethodField()
    program_content = serializers.SerializerMethodField()
    clinical_factors = serializers.SerializerMethodField()

    class Meta:
        model = UserProgram
        fields = ['id', 'program', 'assigned_at', 'completed', 'profile_data', 'program_content', 'clinical_factors']

    def get_profile_data(self, obj):
        """Obtiene datos del perfil necesarios para personalización"""
        profile = obj.user.profile
        
        return {
            'phenotype': profile.phenotype,
            'scenario': profile.scenario,
            'has_hernia': getattr(profile, 'has_hernia', 'NO'),
            'has_altered_motility': getattr(profile, 'has_altered_motility', 'NO'),
            'has_slow_emptying': getattr(profile, 'has_slow_emptying', 'NO'),
            'has_dry_mouth': getattr(profile, 'has_dry_mouth', 'NO'),
            'has_constipation': getattr(profile, 'has_constipation', 'NO'),
            'stress_affects': getattr(profile, 'stress_affects', 'NO'),
            'bmi': getattr(profile, 'bmi', None),
            'has_excess_weight': getattr(profile, 'has_excess_weight', False),
            'display_block': self._determine_display_block(profile)
        }

    def get_program_content(self, obj):
        """Devuelve el contenido del programa estructurado"""
        profile = obj.user.profile
        display_block = self._determine_display_block(profile)
        
        # Contenido de los bloques (movido desde el frontend)
# Reemplaza todo el diccionario program_blocks por esto:

        program_blocks = {
            1: {
                'title': 'ERGE Erosiva',
                'emoji': '🟩',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'En tu endoscopia se ha identificado una inflamación en el esófago, conocida como esofagitis erosiva. Este hallazgo es compatible con daño producido por el reflujo ácido, por lo que es importante actuar combinando el tratamiento médico y los hábitos digestivos adecuados.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante prestarle atención?',
                        'content': [
                            'La esofagitis puede producir síntomas como ardor, molestias al tragar, acidez o incluso dolor torácico.',
                            'En algunos casos, si no se trata bien, puede dar lugar a complicaciones como úlceras, estrechamiento del esófago o un tipo especial de cambio en la mucosa (llamado esófago de Barrett).',
                            'Por eso, este tipo de reflujo siempre debe ser supervisado por tu médico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Al tratarse de una lesión visible en la mucosa esofágica, el tratamiento farmacológico (habitualmente con IBP) es clave para la curación. Pero tus hábitos son igualmente importantes:',
                            'Evita acostarte justo después de comer. Espera al menos 3 horas antes de tumbarte o irte a dormir.',
                            'Cenas ligeras y sin prisas. Las comidas copiosas, especialmente por la noche, agravan los síntomas.',
                            'Si tienes molestias nocturnas, eleva el cabecero de la cama (mejor con alza o cuñas que con almohadas).',
                            'Come sin prisa, masticando bien cada bocado y en un entorno tranquilo.',
                            'Bebe en sorbos pequeños durante el día, preferiblemente lejos de las comidas.',
                            'Combinando el tratamiento médico y las pautas digestivas adecuadas, es posible favorecer la recuperación y prevenir complicaciones.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el tratamiento médico?',
                        'content': 'La esofagitis erosiva siempre requiere seguimiento médico para valorar la evolución y ajustar el tratamiento si es necesario. Lo que haces aquí en GastroAssistant no sustituye esa supervisión, pero puede marcar la diferencia. Mientras sigues el tratamiento pautado por tu especialista, aquí encontrarás hábitos y pautas que te ayudarán a aliviar síntomas y favorecer la recuperación. Tus acciones diarias cuentan —y mucho— en el proceso de mejora.',
                        'icon': 'hospital-user'
                    }
                ]
            },

            2: {
                'title': 'ERGE No Erosiva (NERD)',
                'emoji': '🟨',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Presentas síntomas compatibles con reflujo, aunque la endoscopia no muestra daño visible en el esófago. Sin embargo, la pH-metría ha confirmado que hay un exceso de reflujo ácido. Esto se conoce como ERGE no erosiva o NERD, una forma muy frecuente de reflujo.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'La ausencia de lesiones visibles no hace que los síntomas sean menos molestos o incapacitantes.',
                            'Este tipo de reflujo puede mostrar una respuesta limitada al tratamiento farmacológico, por lo que las medidas de estilo de vida son fundamentales.',
                            'La buena noticia es que, con el enfoque adecuado, puedes recuperar el control y sentirte mucho mejor.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Mastica bien la comida, come sin prisa y sin distracciones. Esto mejora la digestión y reduce los síntomas.',
                            'Evita tumbarte después de comer. Espera al menos 3 horas antes de acostarte.',
                            'Cenas ligeras: evita las comidas copiosas, especialmente por la noche.',
                            'Bebe en sorbos pequeños entre comidas, evitando beber durante la comida.',
                            'Dormir del lado izquierdo puede ayudarte a vaciar el estómago más fácilmente.',
                            'Evita alimentos o bebidas que claramente notes que te sientan mal, pero no hagas restricciones excesivas si no hay una relación clara.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Una endoscopia sin lesiones es un buen punto de partida, pero no significa que todo esté resuelto. Si los síntomas siguen presentes, es importante revisar la situación con tu médico. Mantener revisiones periódicas y avanzar con los hábitos adecuados es la mejor forma de recuperar el equilibrio digestivo.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'En GastroAssistant no esperas a que todo pase solo: te damos herramientas prácticas para que avances, incluso cuando las pruebas no muestran alteraciones.',
                        'icon': 'checkmark-circle'
                    }
                ]
            },

            3: {
                'title': 'Reflujo Extraesofágico',
                'emoji': '🟦',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tus síntomas afectan principalmente a la garganta o al sistema respiratorio superior: carraspeo, ronquera, tos crónica, sensación de cuerpo extraño, entre otros. Este patrón podría estar relacionado con lo que se conoce como reflujo extraesofágico o "reflujo silencioso", una forma de reflujo que a veces se presenta sin los síntomas digestivos clásicos como acidez o ardor. En algunos casos, pueden coexistir molestias digestivas y respiratorias, lo que refuerza la posibilidad de que el reflujo esté implicado, aunque no siempre pueda confirmarse sin pruebas.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante entenderlo?',
                        'content': [
                            'Este tipo de reflujo no siempre causa ardor o molestias típicas, por eso puede pasar desapercibido.',
                            'A veces se relaciona con el ascenso de pequeñas cantidades de ácido o contenido gástrico hacia la zona de la laringe o faringe.',
                            'Según la guía clínica, la relación entre estos síntomas y el reflujo no siempre está clara, pero muchos pacientes mejoran al modificar sus hábitos.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 3 horas antes de acostarte.',
                            'No te tumbes inmediatamente después de comer.',
                            'Reduce alimentos que notes que aumentan tu mucosidad o el carraspeo. En estos casos, algunas personas experimentan más sensibilidad con alimentos muy ácidos, como cítricos o vinagres.',
                            'Evita el carraspeo habitual para romper el círculo vicioso de tos y aclaramiento constante.',
                            'En lugar de aclarar la garganta, mantén una buena hidratación a lo largo del día, tomando sorbos pequeños y frecuentes, preferiblemente entre comidas. Esto ayuda a romper el círculo vicioso de carraspeo y tos.',
                            'Si tienes síntomas nocturnos, puede ayudarte elevar ligeramente el cabecero de la cama y dormir del lado izquierdo.',
                            'Come tranquilo, sin distracciones, y mastica bien cada bocado para facilitar la digestión.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Si los síntomas persisten o interfieren en tu vida diaria, es recomendable consultar con tu médico. En algunos casos, puede ser útil una evaluación complementaria por otorrinolaringología o neumología para descartar otras causas. Aunque no podemos confirmar con seguridad que tus síntomas se deban al reflujo, en base a tus respuestas, es posible que estén relacionados. Por eso, adoptar medidas enfocadas en reducir el reflujo podría ayudarte a aliviarlos de forma progresiva.',
                        'icon': 'hospital-user'
                    }
                ]
            },

            4: {
                'title': 'Perfil Funcional/Hipersensibilidad',
                'emoji': '🟪',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'En tu caso, las pruebas digestivas no han mostrado reflujo ácido excesivo ni lesiones en el esófago. Aun así, los síntomas persisten. Una posible explicación es una mayor sensibilidad del esófago o a una alteración funcional en la forma en que tu cuerpo percibe ciertos estímulos. Es lo que se conoce como hipersensibilidad esofágica o pirosis funcional. Algunas personas, en lugar de notar ardor o molestias típicas, tienen síntomas más altos como carraspeo, tos o sensación de nudo en la garganta. ',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante entenderlo?',
                        'content': [
                            'Este diagnóstico no significa que "no tengas nada": tus síntomas son reales, pero no se deben a un daño físico visible.',
                            'En estos casos, la guía clínica destaca que lo más útil es el enfoque educativo y los cambios en el estilo de vida, más que tratamientos farmacológicos intensivos.',
                            'Factores como el estrés, la ansiedad o haber tenido problemas digestivos durante mucho tiempo pueden hacer que el cuerpo se vuelva más sensible y reaccione con más intensidad, aunque las pruebas estén bien.',
                            'En los trastornos funcionales digestivos, la evidencia sobre el papel de la terapia psicológica (como la terapia cognitivo-conductual o estrategias de regulación emocional) es cada vez más clara. Este tipo de apoyo puede ayudarte a reducir la intensidad del malestar, mejorar la percepción de los síntomas y acompañarte en el proceso de recuperación.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Come en un entorno tranquilo, sin prisas ni distracciones. Masticar bien ayuda a reducir la carga digestiva.',
                            'Hacer unas respiraciones profundas antes de empezar a comer puede ayudarte a relajarte y digerir mejor.',
                            'Evita comidas muy rápidas o muy abundantes, ya que pueden aumentar la sensación de malestar.',
                            'Escucha tu cuerpo: si algún alimento te genera molestias claras, puedes reducirlo, pero no es necesario hacer muchas eliminaciones si no hay una causa identificada.',
                            'Mantén horarios regulares para las comidas y deja suficiente tiempo antes de acostarte.',
                            'Hidrátate bien durante el día y evita grandes cantidades de líquido durante las comidas.',
                            'En los trastornos funcionales digestivos, la evidencia sobre el papel de la terapia psicológica (como la terapia cognitivo-conductual o estrategias de regulación emocional) es cada vez más clara. Este tipo de apoyo puede ayudarte a reducir la intensidad del malestar, mejorar la percepción de los síntomas y acompañarte en el proceso de recuperación.',
                            'Si tus molestias incluyen carraspeo o síntomas en la garganta como tos o mucosidad, necesidad de aclarar constantemente la garganta: Reduce alimentos que notes que aumentan tu mucosidad o el carraspeo (como cítricos o vinagres), Evita carraspear de forma habitual: puede empeorar la irritación y Mantente bien hidratado durante el día, con pequeños sorbos entre comidas.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Este tipo de diagnóstico suele confirmarse tras descartar otras causas mediante pruebas. Si no te has hecho una evaluación completa, coméntaselo a tu médico. Si ya estás en seguimiento, complementar el enfoque médico con estrategias digestivas, hábitos saludables y técnicas de regulación emocional puede ayudarte a mejorar. En los perfiles funcionales, el apoyo psicológico puede ser un recurso valioso para gestionar mejor los síntomas y reducir su impacto en tu día a día',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'A veces, los síntomas digestivos persisten aunque las pruebas salgan bien. Eso no significa que no exista un problema, sino que su origen puede estar en cómo funciona el sistema digestivo, más que en un daño visible. Con un enfoque centrado en tus hábitos y bienestar, puedes avanzar y sentirte cada vez mejor.',
                        'icon': 'checkmark-circle'
                    }
                ]
            },

            5: {
                'title': 'Síntomas Digestivos sin Pruebas',
                'emoji': '🟫',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tus respuestas indican molestias digestivas típicas como acidez, ardor o regurgitación, compatibles con un perfil de reflujo. Sin embargo, actualmente no se han realizado pruebas diagnósticas que permitan confirmar con seguridad si hay reflujo ácido. En muchos casos, estos síntomas mejoran aplicando cambios en los hábitos digestivos. Si persisten, consulta con tu médico para valorar la necesidad de una evaluación más completa.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'Muchas personas mejoran aplicando cambios en sus hábitos, incluso antes de recibir un diagnóstico confirmado.',
                            'Aun así, si los síntomas persisten o aumentan, consultar con un médico es clave para avanzar en el diagnóstico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita tumbarte justo después de comer. Espera al menos 2 horas antes de acostarte.',
                            'Mantén cenas ligeras, y deja un margen suficiente entre la última comida y el momento de dormir.',
                            'Come sin prisas, en un entorno tranquilo, masticando bien cada bocado.',
                            'Identifica si hay alimentos o bebidas que claramente te sientan mal y evítalos, sin necesidad de hacer restricciones muy amplias.',
                            'Hidrátate con sorbos pequeños a lo largo del día, mejor entre comidas.',
                            'Dormir del lado izquierdo y elevar ligeramente el cabecero puede ayudarte si tienes molestias nocturnas.',
                            'Adoptar estos hábitos puede ayudarte a aliviar los síntomas mientras avanzas con el estudio médico y defines el enfoque más adecuado para tu caso.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Si los síntomas persisten, empeoran o te preocupan, no lo ignores: solicita una evaluación médica. Tu profesional de referencia podrá valorar si es necesario realizar estudios adicionales para comprender mejor lo que ocurre y decidir el tratamiento más adecuado.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'Muchas personas comienzan a mejorar antes incluso de tener un diagnóstico completo, simplemente aplicando cambios clave en sus hábitos. Pero si los síntomas persisten, no lo ignores: dar el paso hacia una evaluación puede ser lo que necesitas para avanzar.',
                        'icon': 'checkmark-circle'
                    }
                ]
            },

            6: {
                'title': 'Bienestar Digestivo',
                'emoji': '⚪',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Según tus respuestas, no se detectan síntomas típicos de reflujo ni molestias digestivas relevantes en este momento. Tampoco hay constancia de pruebas digestivas con hallazgos que indiquen un problema activo.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es útil conocer esto?',
                        'content': [
                            'No tener síntomas ahora no significa que no debas cuidar tu digestión.',
                            'Prestar atención a tus hábitos puede ayudarte a mantener una buena salud digestiva a largo plazo.',
                            'Si en algún momento notas molestias, sabrás qué observar y cómo actuar de forma preventiva.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mantener una buena salud digestiva?',
                        'content': [
                            'Come tranquilo, sin distracciones ni prisas, y mastica bien cada bocado.',
                            'Evita comidas muy abundantes o muy tardías, especialmente si vas a acostarte después.',
                            'Prioriza el descanso.',
                            'Evita productos y alimentos ultraprocesados.',
                            'Mantén horarios regulares para tus comidas y una alimentación variada, adaptada a tu tolerancia.',
                            'Hidrátate bien a lo largo del día, evitando beber en exceso durante las comidas.',
                            'Realiza actividad física moderada de forma regular, ya que favorece la motilidad y el bienestar general.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y si en algún momento aparecen síntomas?',
                        'content': 'Si en el futuro experimentas ardor, acidez, molestias digestivas, tos persistente o sensación de reflujo, te recomendamos repetir los cuestionarios y valorar una consulta médica si los síntomas persisten.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'Aunque ahora no presentes síntomas, cuidar tus hábitos es la mejor forma de mantener tu sistema digestivo en equilibrio. La salud digestiva va más allá de la ausencia de molestias: influye en tu energía, tu bienestar diario y tu salud general a largo plazo. Por eso, te animamos a utilizar GastroAssistant para identificar qué áreas puedes reforzar y empezar a trabajar en hábitos que te ayuden a mantenerte bien hoy y prevenir problemas en el futuro.',
                        'icon': 'checkmark-circle'
                    }
                ]
            },

            7: {
                'title': 'Síntomas Extraesofágicos sin Pruebas',
                'emoji': '🟫',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tus síntomas afectan principalmente a la garganta o vías respiratorias superiores: carraspeo, tos crónica, ronquera o sensación de cuerpo extraño. Aunque estos síntomas pueden estar relacionados con reflujo extraesofágico, no se han realizado pruebas que lo confirmen. En muchos casos, adoptar ciertos hábitos digestivos y posturales ayuda a reducir estas molestias. Si los síntomas persisten, consulta con un profesional para valorar posibles pruebas o derivación.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'A veces se relaciona con el ascenso de pequeñas cantidades de ácido o contenido gástrico hacia la zona de la laringe o faringe.',
                            'Según la guía clínica, la relación entre estos síntomas y el reflujo no siempre está clara, pero muchos pacientes mejoran al modificar sus hábitos.',
                            'Muchas personas mejoran aplicando cambios en sus hábitos, incluso antes de recibir un diagnóstico confirmado.',
                            'Aun así, si los síntomas persisten o aumentan, consultar con un médico es clave para avanzar en el diagnóstico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'En tu caso, los síntomas afectan más a la garganta y las vías respiratorias altas. Aunque no siempre hay daño visible, este tipo de reflujo suele responder bien a cambios en los hábitos y en el estilo de vida.',
                            'Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 3 horas antes de acostarte.',
                            'No te tumbes inmediatamente después de comer.',
                            'Reduce alimentos que notes que aumentan tu mucosidad o el carraspeo. En estos casos, algunas personas experimentan más sensibilidad con alimentos muy ácidos, como cítricos o vinagres.',
                            'Evita el carraspeo habitual para romper el círculo vicioso de tos y aclaramiento constante.',
                            'En lugar de aclarar la garganta, mantén una buena hidratación a lo largo del día, tomando sorbos pequeños y frecuentes, preferiblemente entre comidas. Esto ayuda a romper el círculo vicioso de carraspeo y tos.',
                            'Si tienes síntomas nocturnos, puede ayudarte elevar ligeramente el cabecero de la cama y dormir del lado izquierdo.',
                            'Come tranquilo, sin distracciones, y mastica bien cada bocado para facilitar la digestión.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Si los síntomas persisten, empeoran o te preocupan, no lo ignores: solicita una evaluación médica. Tu profesional de referencia podrá valorar si es necesario realizar estudios adicionales para comprender mejor lo que ocurre y decidir el tratamiento más adecuado. En algunos casos, puede ser útil una evaluación complementaria por otorrinolaringología o neumología para descartar otras causas.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'Muchas personas comienzan a mejorar antes incluso de tener un diagnóstico completo, simplemente aplicando cambios clave en sus hábitos. Pero si los síntomas persisten, no lo ignores: dar el paso hacia una evaluación puede ser lo que necesitas para avanzar.',
                        'icon': 'checkmark-circle'
                    }
                ]
            },

            8: {
                'title': 'Perfil Mixto sin Pruebas',
                'emoji': '🟫',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tus respuestas reflejan síntomas tanto digestivos como extraesofágicos. Esto puede estar relacionado con un reflujo que afecte tanto al esófago como a las vías respiratorias altas. Sin pruebas diagnósticas aún realizadas, no podemos confirmarlo, pero aplicar medidas en ambos frentes puede ayudarte a mejorar. Si los síntomas persisten, es importante valorarlo con tu médico.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'Muchas personas mejoran aplicando cambios en sus hábitos, incluso antes de recibir un diagnóstico confirmado.',
                            'Aun así, si los síntomas persisten o aumentan, consultar con un médico es clave para avanzar en el diagnóstico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 3 horas antes de acostarte.',
                            'No te tumbes inmediatamente después de comer.',
                            'Reduce alimentos que notes que aumentan tu mucosidad o el carraspeo. En estos casos, algunas personas experimentan más sensibilidad con alimentos muy ácidos, como cítricos o vinagres.',
                            'Evita el carraspeo habitual para romper el círculo vicioso de tos y aclaramiento constante.',
                            'En lugar de aclarar la garganta, mantén una buena hidratación a lo largo del día, tomando sorbos pequeños y frecuentes, preferiblemente entre comidas. Esto ayuda a romper el círculo vicioso de carraspeo y tos.',
                            'Si tienes síntomas nocturnos, puede ayudarte elevar ligeramente el cabecero de la cama y dormir del lado izquierdo.',
                            'Come tranquilo, sin distracciones, y mastica bien cada bocado para facilitar la digestión.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Si los síntomas persisten, empeoran o te preocupan, no lo ignores: solicita una evaluación médica. Tu profesional de referencia podrá valorar si es necesario realizar estudios adicionales para comprender mejor lo que ocurre y decidir el tratamiento más adecuado. En algunos casos, puede ser útil una evaluación complementaria por otorrinolaringología o neumología para descartar otras causas.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'Muchas personas comienzan a mejorar antes incluso de tener un diagnóstico completo, simplemente aplicando cambios clave en sus hábitos. Pero si los síntomas persisten, no lo ignores: dar el paso hacia una evaluación puede ser lo que necesitas para avanzar.',
                        'icon': 'checkmark-circle'
                    }
                ]
            },
            9: {  # 🆕 NUEVO BLOQUE: NERD MIXTO
                'title': 'ERGE No Erosiva Mixta (NERD Mixto)',
                'emoji': '🟨',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tus síntomas incluyen tanto molestias digestivas típicas (como ardor, acidez o regurgitación) como síntomas respiratorios o de garganta (como tos, carraspeo o ronquera). En tu caso, ya se ha confirmado la presencia de reflujo ácido mediante pruebas, lo que puede explicar ambos tipos de síntomas. Por eso, es importante trabajar tanto los hábitos digestivos como aquellos que pueden ayudarte a mejorar las molestias de garganta o respiratorias.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'La ausencia de lesiones visibles no hace que los síntomas sean menos molestos o incapacitantes.',
                            'Este tipo de reflujo puede mostrar una respuesta limitada al tratamiento farmacológico, por lo que las medidas de estilo de vida son fundamentales.',
                            'Al tener síntomas mixtos, es crucial abordar tanto los aspectos digestivos como los respiratorios para lograr una mejoría integral.',
                            'La buena noticia es que, con el enfoque adecuado, puedes recuperar el control y sentirte mucho mejor.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 3 horas antes de acostarte.',
                            'No te tumbes inmediatamente después de comer.',
                            'Reduce alimentos que notes que aumentan tu mucosidad o el carraspeo. En estos casos, algunas personas experimentan más sensibilidad con alimentos muy ácidos, como cítricos o vinagres.',
                            'Evita el carraspeo habitual para romper el círculo vicioso de tos y aclaramiento constante.',
                            'En lugar de aclarar la garganta, mantén una buena hidratación a lo largo del día, tomando sorbos pequeños y frecuentes, preferiblemente entre comidas. Esto ayuda a romper el círculo vicioso de carraspeo y tos.',
                            'Si tienes síntomas nocturnos, puede ayudarte elevar ligeramente el cabecero de la cama y dormir del lado izquierdo.',
                            'Come tranquilo, sin distracciones, y mastica bien cada bocado para facilitar la digestión.',
                            'Bebe en sorbos pequeños entre comidas, evitando beber durante la comida.',
                            'Evita alimentos o bebidas que claramente notes que te sientan mal, pero no hagas restricciones excesivas si no hay una relación clara.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Una endoscopia sin lesiones es un buen punto de partida, pero no significa que todo esté resuelto. Al presentar síntomas tanto digestivos como respiratorios, puede ser útil un enfoque multidisciplinar. Si los síntomas siguen presentes, es importante revisar la situación con tu médico. En algunos casos, puede ser beneficiosa la valoración por otorrinolaringología para los síntomas de garganta. Mantener revisiones periódicas y avanzar con los hábitos adecuados es la mejor forma de recuperar el equilibrio digestivo.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'En GastroAssistant no esperas a que todo pase solo: te damos herramientas prácticas para que avances, incluso cuando las pruebas no muestran alteraciones. El hecho de que tengas síntomas mixtos significa que necesitas un enfoque integral, y aquí te acompañaremos en cada paso del camino.',
                        'icon': 'checkmark-circle'
                    }
                ]
            }
        }
        
        return program_blocks.get(display_block, program_blocks[6])

    def get_clinical_factors(self, obj):
        """Obtiene los factores clínicos aplicables al usuario desde la base de datos"""
        profile = obj.user.profile
        applicable_factors = []
        
        # Importar el modelo necesario
        from recommendations.models import ConditionalRecommendation
        
        # Mapeo de condiciones del perfil a tipos de recomendación y valores
        profile_conditions = []
        
        # 1. Hernia
        if getattr(profile, 'has_hernia', 'NO') == 'YES':
            profile_conditions.append(('HERNIA', 'YES'))
        
        # 2. Gastritis
        if getattr(profile, 'has_gastritis', 'NO') == 'YES':
            profile_conditions.append(('GASTRITIS', 'YES'))
        
        # 3. Motilidad alterada
        if getattr(profile, 'has_altered_motility', 'NO') == 'YES':
            profile_conditions.append(('MOTILITY', 'YES'))
        
        # 4. Vaciamiento lento
        if getattr(profile, 'has_slow_emptying', 'NO') == 'YES':
            profile_conditions.append(('EMPTYING', 'YES'))
        
        # 5. Sequedad bucal
        if getattr(profile, 'has_dry_mouth', 'NO') == 'YES':
            profile_conditions.append(('SALIVA', 'YES'))
        
        # 6. Estreñimiento
        constipation_status = getattr(profile, 'has_constipation', 'NO')
        if constipation_status in ['YES', 'SOMETIMES']:
            profile_conditions.append(('CONSTIPATION', constipation_status))
        
        # 7. Alteraciones intestinales
        if getattr(profile, 'has_intestinal_disorders', 'NO') == 'YES':
            profile_conditions.append(('INTESTINAL', 'YES'))
        
        # 8. H. pylori
        h_pylori_status = getattr(profile, 'h_pylori_status', 'NO')
        if h_pylori_status == 'ACTIVE':
            profile_conditions.append(('H_PYLORI', 'ACTIVE'))
        elif h_pylori_status == 'TREATED':
            profile_conditions.append(('H_PYLORI', 'TREATED'))
        
        # 9. Estrés
        stress_status = getattr(profile, 'stress_affects', 'NO')
        if stress_status in ['YES', 'SOMETIMES']:
            profile_conditions.append(('STRESS', stress_status))
        
        # 10. IMC elevado
        if getattr(profile, 'has_excess_weight', False):
            profile_conditions.append(('BMI', 'BMI_OVER_25'))
        
        # 11. Smoking y Alcohol desde UserHabitAnswer
        try:
            from questionnaires.models import UserHabitAnswer
            
            # SMOKING
            smoking_answer = UserHabitAnswer.objects.filter(
                user=obj.user,
                question__habit_type='SMOKING',
                is_onboarding=True
            ).first()
            
            if smoking_answer and smoking_answer.selected_option.value in [0, 1]:
                profile_conditions.append(('SMOKING', 'YES'))
            
            # ALCOHOL
            alcohol_answer = UserHabitAnswer.objects.filter(
                user=obj.user,
                question__habit_type='ALCOHOL',
                is_onboarding=True
            ).first()
            
            if alcohol_answer and alcohol_answer.selected_option.value in [0, 1, 2]:
                profile_conditions.append(('ALCOHOL', 'YES'))
                
        except Exception as e:
            print(f"❌ Error al leer hábitos SMOKING/ALCOHOL: {str(e)}")
        
        # Ahora buscar las recomendaciones correspondientes en la BD
        for rec_type, condition_value in profile_conditions:
            try:
                recommendation = ConditionalRecommendation.objects.filter(
                    recommendation_type__type=rec_type,
                    condition_value=condition_value,
                    is_active=True
                ).first()
                
                if recommendation:
                    # Crear el diccionario con la estructura que espera el frontend
                    factor = {
                        'title': recommendation.title,
                        'content': recommendation.content,
                        'tools': recommendation.tools,
                        'icon': recommendation.icon_type or 'medical'  # Fallback a 'medical' si no hay icon_type
                    }
                    applicable_factors.append(factor)
                    
            except Exception as e:
                print(f"❌ Error al buscar recomendación {rec_type}-{condition_value}: {str(e)}")
        
        return applicable_factors

    def _determine_display_block(self, profile):
        """
        Determina qué bloque mostrar basado en el escenario del usuario.
        Mapeo actualizado según la nueva tabla de escenarios A-R.
        """
        scenario = profile.scenario
        
        # Mapeo directo de escenarios a bloques según la nueva tabla
        scenario_to_block = {
            'A': 1,   # ERGE Erosiva
            'B': 9,   # NERD Mixto
            'C': 2,   # NERD
            'D': 3,   # Reflujo Extraesofágico
            'E': 6,   # Bienestar Digestivo (CAMBIADO del 2 al 6)
            'F': 4,   # Perfil Funcional
            'F2': 4,  # Perfil Funcional
            'F3': 4,  # Perfil Funcional
            'F4': 6,  # Bienestar Digestivo
            'G': 8,   # Perfil Mixto sin Pruebas
            'H': 5,   # Síntomas Digestivos sin Pruebas
            'I': 7,   # Síntomas Extraesofágicos sin Pruebas
            'J': 6,   # Bienestar Digestivo
            'K': 8,   # Perfil Mixto sin Pruebas
            'L': 5,   # Síntomas Digestivos sin Pruebas
            'M': 7,   # Síntomas Extraesofágicos sin Pruebas
            'N': 6,   # Bienestar Digestivo
            'O': 8,   # Perfil Mixto sin Pruebas
            'P': 5,   # Síntomas Digestivos sin Pruebas
            'Q': 7,   # Síntomas Extraesofágicos sin Pruebas
            'R': 6,   # Bienestar Digestivo
        }
        
        # Si tenemos un escenario, usar el mapeo directo
        if scenario and scenario in scenario_to_block:
            return scenario_to_block[scenario]
        
        # Fallback por si acaso no hay escenario (no debería pasar con el nuevo algoritmo)
        # pero lo mantenemos por compatibilidad
        phenotype = profile.phenotype
        phenotype_to_block = {
            'EROSIVE': 1,
            'NERD': 2,
            'NERD_MIXED': 9,
            'EXTRAESOPHAGEAL': 3,
            'FUNCTIONAL': 4,
            'SYMPTOMS_NO_TESTS': 5,
            'NO_SYMPTOMS': 6,
            'EXTRAESOPHAGEAL_NO_TESTS': 7,
            'SYMPTOMS_MIXED_NO_TESTS': 8,
        }
        
        return phenotype_to_block.get(phenotype, 6)  # Default a Bienestar Digestivo